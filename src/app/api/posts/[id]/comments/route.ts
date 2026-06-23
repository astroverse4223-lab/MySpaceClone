import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validations/posts";
import { createNotification } from "@/lib/notifications";
import { extractMentions } from "@/lib/text";

const authorSelect = { id: true, username: true, name: true, image: true } as const;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id: postId } = await params;
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: authorSelect },
      reactions: { select: { emoji: true, userId: true } },
    },
  });

  const shaped = comments.map((c) => {
    const counts: Record<string, number> = {};
    let viewerReaction: string | null = null;
    for (const r of c.reactions) {
      counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
      if (session?.user && r.userId === session.user.id) viewerReaction = r.emoji;
    }
    return {
      id: c.id,
      postId: c.postId,
      parentId: c.parentId,
      content: c.content,
      createdAt: c.createdAt,
      author: c.author,
      likeCount: c.reactions.length,
      reactionCounts: counts,
      viewerReaction,
      viewerLiked: viewerReaction !== null,
    };
  });

  return NextResponse.json({ comments: shaped, postAuthorId: post?.authorId ?? null });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  if (parsed.data.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parsed.data.parentId } });
    if (!parent || parent.postId !== postId) {
      return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
    }
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId: session.user.id,
      content: parsed.data.content,
      parentId: parsed.data.parentId,
    },
    include: { author: { select: authorSelect } },
  });

  await createNotification({
    userId: post.authorId,
    actorId: session.user.id,
    type: "POST_COMMENT",
    message: `@${session.user.username} commented on your post`,
    link: "/feed",
  });

  if (parsed.data.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parsed.data.parentId },
      select: { authorId: true },
    });
    if (parent && parent.authorId !== post.authorId) {
      await createNotification({
        userId: parent.authorId,
        actorId: session.user.id,
        type: "COMMENT_REPLY",
        message: `@${session.user.username} replied to your comment`,
        link: "/feed",
      });
    }
  }

  const mentioned = extractMentions(parsed.data.content);
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
          message: `@${session.user.username} mentioned you in a comment`,
          link: "/feed",
        }),
      ),
    );
  }

  return NextResponse.json({ comment });
}
