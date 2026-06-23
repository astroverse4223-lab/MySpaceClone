import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPostSchema } from "@/lib/validations/posts";
import { serializePosts } from "@/lib/posts";
import { extractMentions } from "@/lib/text";
import { createNotification } from "@/lib/notifications";
import { getBlockedUserIds } from "@/lib/social";

const authorSelect = { id: true, username: true, name: true, image: true } as const;

// Reels are ephemeral and auto-deleted after this many hours.
export const REEL_TTL_HOURS = 24;

export async function GET(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 50);

  const communityId = url.searchParams.get("communityId") ?? undefined;
  const tag = url.searchParams.get("tag")?.trim().toLowerCase() ?? undefined;
  const blockedIds = await getBlockedUserIds(session?.user?.id);

  const posts = await prisma.post.findMany({
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where: {
      ...(communityId ? { communityId } : { communityId: null, isReel: false }),
      ...(tag ? { content: { contains: `#${tag}`, mode: "insensitive" } } : {}),
      ...(blockedIds.length ? { authorId: { notIn: blockedIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: authorSelect },
      reactions: true,
      _count: { select: { comments: true, reposts: true } },
    },
  });

  const serialized = await serializePosts(posts, session?.user?.id);
  const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;

  return NextResponse.json({ posts: serialized, nextCursor });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { type, content, images, videoUrl, gifUrl, pollOptions, communityId, isReel, requiredTierId } = parsed.data;

  if (!content && !images?.length && !videoUrl && !gifUrl && !pollOptions?.length) {
    return NextResponse.json({ error: "Post can't be empty" }, { status: 400 });
  }

  if (type === "POLL" && (!pollOptions || pollOptions.length < 2)) {
    return NextResponse.json({ error: "Polls need at least 2 options" }, { status: 400 });
  }

  // A reel is either a video (VIDEO + videoUrl) or an image (IMAGE + at least one image).
  if (isReel && !(type === "VIDEO" && videoUrl) && !(type === "IMAGE" && images?.length)) {
    return NextResponse.json({ error: "Reels need a video or an image" }, { status: 400 });
  }

  if (communityId) {
    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: session.user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Join the community to post" }, { status: 403 });
    }
  }

  if (requiredTierId) {
    const tier = await prisma.membershipTier.findUnique({ where: { id: requiredTierId } });
    if (!tier || tier.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Invalid membership tier" }, { status: 400 });
    }
  }

  const post = await prisma.post.create({
    data: {
      authorId: session.user.id,
      communityId,
      requiredTierId,
      type,
      isReel: Boolean(isReel),
      content,
      images: images ?? [],
      videoUrl,
      gifUrl,
      // Reels are ephemeral — they expire and get cleaned up after REEL_TTL_HOURS.
      expiresAt: isReel ? new Date(Date.now() + REEL_TTL_HOURS * 60 * 60 * 1000) : null,
      pollOptions: type === "POLL" ? pollOptions : undefined,
      pollVotes: type === "POLL" ? { counts: pollOptions?.map(() => 0) } : undefined,
    },
    include: {
      author: { select: authorSelect },
      reactions: true,
      _count: { select: { comments: true, reposts: true } },
    },
  });

  const mentioned = extractMentions(content);
  if (mentioned.length) {
    const users = await prisma.user.findMany({
      where: { username: { in: mentioned }, id: { not: session.user.id } },
      select: { id: true },
    });
    await Promise.all(
      users.map((u) =>
        createNotification({
          userId: u.id,
          actorId: session.user.id,
          type: "MENTION",
          message: `@${session.user.username} mentioned you in a post`,
          link: "/feed",
        }),
      ),
    );
  }

  const [serialized] = await serializePosts([post], session.user.id);
  return NextResponse.json({ post: serialized });
}
