import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializePosts } from "@/lib/posts";
import { getAcceptedFriendIds } from "@/lib/friends";

const authorSelect = { id: true, username: true, name: true, image: true } as const;

export async function GET(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const feed = url.searchParams.get("feed") === "following" ? "following" : "discover";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 10), 30);

  let authorIds: string[] | undefined;
  if (feed === "following" && session?.user) {
    const friendIds = await getAcceptedFriendIds(session.user.id);
    authorIds = [session.user.id, ...friendIds];
  }

  const now = new Date();
  // Reels are ephemeral — sweep expired ones, then exclude them from results.
  await prisma.post.deleteMany({ where: { isReel: true, expiresAt: { lt: now } } }).catch(() => {});

  const reels = await prisma.post.findMany({
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where: {
      isReel: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...(authorIds ? { authorId: { in: authorIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: authorSelect },
      reactions: true,
      _count: { select: { comments: true, reposts: true } },
    },
  });

  const serialized = await serializePosts(reels, session?.user?.id);
  const nextCursor = reels.length === limit ? reels[reels.length - 1].id : null;

  return NextResponse.json({ reels: serialized, nextCursor });
}
