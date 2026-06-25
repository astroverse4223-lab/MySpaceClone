import { prisma } from "@/lib/prisma";
import { getAcceptedFriendIds } from "@/lib/friends";

// A unified "what's new" timeline that merges several kinds of activity from the
// people a viewer cares about (their friends + everyone they follow) into one
// reverse-chronological stream.

export type ActivityActor = {
  username: string;
  name: string | null;
  image: string | null;
  avatarImage: string | null;
};

export type ActivityKind =
  | "post"
  | "photo"
  | "article"
  | "event"
  | "playlist"
  | "friendship"
  | "mood";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  actor: ActivityActor;
  createdAt: string;
  /** Short human sentence describing what happened, sans the actor's name. */
  text: string;
  /** Where clicking the item should take you. */
  link: string;
  /** Optional thumbnail / preview image. */
  image?: string | null;
  /** Optional snippet of the content. */
  excerpt?: string | null;
};

const actorSelect = {
  username: true,
  name: true,
  image: true,
  profile: { select: { avatarImage: true } },
} as const;

type RawActor = {
  username: string;
  name: string | null;
  image: string | null;
  profile: { avatarImage: string | null } | null;
};

function actor(a: RawActor): ActivityActor {
  return { username: a.username, name: a.name, image: a.image, avatarImage: a.profile?.avatarImage ?? null };
}

function truncate(text: string | null | undefined, max = 140): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/** The set of user ids whose activity a viewer should see. */
export async function getActivityAudience(viewerId: string): Promise<string[]> {
  const [friendIds, following] = await Promise.all([
    getAcceptedFriendIds(viewerId),
    prisma.follow.findMany({ where: { followerId: viewerId }, select: { followingId: true } }),
  ]);
  const ids = new Set<string>(friendIds);
  for (const f of following) ids.add(f.followingId);
  ids.delete(viewerId); // never surface your own activity here
  return [...ids];
}

/**
 * Build a page of activity. `before` is an ISO timestamp cursor — pass the
 * previous page's `nextCursor` to load older items.
 */
export async function getActivityFeed(
  viewerId: string,
  options: { limit?: number; before?: string } = {},
): Promise<{ items: ActivityItem[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 50);
  const audience = await getActivityAudience(viewerId);

  if (audience.length === 0) {
    return { items: [], nextCursor: null };
  }

  const before = options.before ? new Date(options.before) : null;
  const beforeFilter = before && !Number.isNaN(before.getTime()) ? { lt: before } : undefined;
  const authorIn = { in: audience };

  // We over-fetch a little from each source (limit + 1 each) so that after the
  // merge + sort there's enough to fill the page and detect a next cursor.
  const take = limit + 1;

  const [posts, photos, articles, events, playlists, friendships, moods] = await Promise.all([
    prisma.post.findMany({
      where: {
        authorId: authorIn,
        isReel: false,
        communityId: null,
        requiredTierId: null,
        ...(beforeFilter ? { createdAt: beforeFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, content: true, images: true, createdAt: true, author: { select: actorSelect } },
    }),
    prisma.photo.findMany({
      where: { userId: authorIn, ...(beforeFilter ? { createdAt: beforeFilter } : {}) },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, url: true, caption: true, createdAt: true, user: { select: actorSelect } },
    }),
    prisma.article.findMany({
      where: {
        authorId: authorIn,
        status: "PUBLISHED",
        ...(beforeFilter ? { publishedAt: beforeFilter } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take,
      select: {
        id: true, slug: true, title: true, excerpt: true, coverImage: true, publishedAt: true,
        author: { select: actorSelect },
      },
    }),
    prisma.event.findMany({
      where: { createdById: authorIn, ...(beforeFilter ? { createdAt: beforeFilter } : {}) },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true, title: true, coverImage: true, startsAt: true, createdAt: true,
        createdBy: { select: actorSelect },
      },
    }),
    prisma.playlist.findMany({
      where: { userId: authorIn, ...(beforeFilter ? { createdAt: beforeFilter } : {}) },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true, name: true, coverImage: true, createdAt: true,
        user: { select: actorSelect },
      },
    }),
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        respondedAt: beforeFilter ?? { not: null },
        OR: [{ requesterId: authorIn }, { addresseeId: authorIn }],
      },
      orderBy: { respondedAt: "desc" },
      take,
      select: {
        id: true, respondedAt: true, requesterId: true, addresseeId: true,
        requester: { select: actorSelect },
        addressee: { select: actorSelect },
      },
    }),
    prisma.profile.findMany({
      where: {
        userId: authorIn,
        mood: { not: null },
        ...(beforeFilter ? { updatedAt: beforeFilter } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take,
      select: {
        id: true, mood: true, moodEmoji: true, updatedAt: true,
        user: { select: actorSelect },
      },
    }),
  ]);

  const items: ActivityItem[] = [];

  for (const p of posts) {
    items.push({
      id: `post:${p.id}`,
      kind: "post",
      actor: actor(p.author),
      createdAt: p.createdAt.toISOString(),
      text: "shared a post",
      link: `/feed#post-${p.id}`,
      image: p.images[0] ?? null,
      excerpt: truncate(p.content),
    });
  }
  for (const ph of photos) {
    items.push({
      id: `photo:${ph.id}`,
      kind: "photo",
      actor: actor(ph.user),
      createdAt: ph.createdAt.toISOString(),
      text: "added a new photo",
      link: `/profile/${ph.user.username}/photos`,
      image: ph.url,
      excerpt: truncate(ph.caption),
    });
  }
  for (const a of articles) {
    items.push({
      id: `article:${a.id}`,
      kind: "article",
      actor: actor(a.author),
      createdAt: (a.publishedAt ?? new Date()).toISOString(),
      text: "published a blog post",
      link: `/blog/${a.slug}`,
      image: a.coverImage,
      excerpt: truncate(a.excerpt ?? a.title),
    });
  }
  for (const e of events) {
    items.push({
      id: `event:${e.id}`,
      kind: "event",
      actor: actor(e.createdBy),
      createdAt: e.createdAt.toISOString(),
      text: "is hosting an event",
      link: `/events/${e.id}`,
      image: e.coverImage,
      excerpt: truncate(e.title),
    });
  }
  for (const pl of playlists) {
    items.push({
      id: `playlist:${pl.id}`,
      kind: "playlist",
      actor: actor(pl.user),
      createdAt: pl.createdAt.toISOString(),
      text: "made a new playlist",
      link: `/playlists`,
      image: pl.coverImage,
      excerpt: truncate(pl.name),
    });
  }
  const audienceSet = new Set(audience);
  for (const f of friendships) {
    if (!f.respondedAt) continue;
    // Attribute the activity to whichever side the viewer follows (the one in
    // the audience); the other person is who they connected with.
    const subjectIsRequester = audienceSet.has(f.requesterId);
    const subject = subjectIsRequester ? f.requester : f.addressee;
    const other = subjectIsRequester ? f.addressee : f.requester;
    items.push({
      id: `friendship:${f.id}`,
      kind: "friendship",
      actor: actor(subject),
      createdAt: f.respondedAt.toISOString(),
      text: `became friends with @${other.username}`,
      link: `/profile/${other.username}`,
      image: other.profile?.avatarImage ?? other.image,
    });
  }
  for (const m of moods) {
    items.push({
      id: `mood:${m.id}`,
      kind: "mood",
      actor: actor(m.user),
      createdAt: m.updatedAt.toISOString(),
      text: `is feeling ${m.moodEmoji ? m.moodEmoji + " " : ""}${m.mood}`,
      link: `/profile/${m.user.username}`,
    });
  }

  // Merge, newest first, and page.
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const page = items.slice(0, limit);
  const nextCursor = items.length > limit ? page[page.length - 1]?.createdAt ?? null : null;

  return { items: page, nextCursor };
}
