import { prisma } from "@/lib/prisma";

// Cross-entity search over users, posts, communities, articles and events.
// Used by both the navbar quick-search dropdown (small `limit`) and the full
// /search results page (larger `limit`).

export type SearchUser = {
  type: "user";
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  headline: string | null;
  link: string;
};

export type SearchPost = {
  type: "post";
  id: string;
  excerpt: string;
  authorUsername: string;
  authorName: string | null;
  createdAt: string;
  link: string;
};

export type SearchCommunity = {
  type: "community";
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconImage: string | null;
  memberCount: number;
  link: string;
};

export type SearchArticle = {
  type: "article";
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  authorUsername: string;
  link: string;
};

export type SearchEvent = {
  type: "event";
  id: string;
  title: string;
  startsAt: string;
  location: string | null;
  link: string;
};

export type SearchResults = {
  users: SearchUser[];
  posts: SearchPost[];
  communities: SearchCommunity[];
  articles: SearchArticle[];
  events: SearchEvent[];
};

function snippet(text: string | null, max = 160): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export async function globalSearch(q: string, limit = 5): Promise<SearchResults> {
  const query = q.trim();
  if (query.length < 2) {
    return { users: [], posts: [], communities: [], articles: [], events: [] };
  }

  const insensitive = { contains: query, mode: "insensitive" as const };

  const [users, posts, communities, articles, events] = await Promise.all([
    prisma.user.findMany({
      where: {
        isSuspended: false,
        OR: [{ username: insensitive }, { name: insensitive }],
      },
      select: {
        id: true, username: true, name: true, image: true,
        profile: { select: { headline: true, avatarImage: true } },
      },
      take: limit,
    }),
    prisma.post.findMany({
      where: {
        isReel: false,
        communityId: null,
        requiredTierId: null,
        content: insensitive,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, content: true, createdAt: true,
        author: { select: { username: true, name: true } },
      },
      take: limit,
    }),
    prisma.community.findMany({
      where: {
        visibility: "PUBLIC",
        OR: [{ name: insensitive }, { description: insensitive }, { slug: insensitive }],
      },
      orderBy: { members: { _count: "desc" } },
      select: {
        id: true, name: true, slug: true, description: true, iconImage: true,
        _count: { select: { members: true } },
      },
      take: limit,
    }),
    prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ title: insensitive }, { excerpt: insensitive }, { tags: { has: query } }],
      },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true, title: true, slug: true, excerpt: true,
        author: { select: { username: true } },
      },
      take: limit,
    }),
    prisma.event.findMany({
      where: {
        OR: [{ title: insensitive }, { description: insensitive }, { location: insensitive }],
      },
      orderBy: { startsAt: "asc" },
      select: { id: true, title: true, startsAt: true, location: true },
      take: limit,
    }),
  ]);

  return {
    users: users.map((u) => ({
      type: "user",
      id: u.id,
      username: u.username,
      name: u.name,
      image: u.profile?.avatarImage ?? u.image,
      headline: u.profile?.headline ?? null,
      link: `/profile/${u.username}`,
    })),
    posts: posts.map((p) => ({
      type: "post",
      id: p.id,
      excerpt: snippet(p.content),
      authorUsername: p.author.username,
      authorName: p.author.name,
      createdAt: p.createdAt.toISOString(),
      link: `/feed#post-${p.id}`,
    })),
    communities: communities.map((c) => ({
      type: "community",
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: snippet(c.description),
      iconImage: c.iconImage,
      memberCount: c._count.members,
      link: `/communities/${c.slug}`,
    })),
    articles: articles.map((a) => ({
      type: "article",
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: snippet(a.excerpt),
      authorUsername: a.author.username,
      link: `/blog/${a.slug}`,
    })),
    events: events.map((e) => ({
      type: "event",
      id: e.id,
      title: e.title,
      startsAt: e.startsAt.toISOString(),
      location: e.location,
      link: `/events/${e.id}`,
    })),
  };
}

export function totalResults(r: SearchResults): number {
  return r.users.length + r.posts.length + r.communities.length + r.articles.length + r.events.length;
}
