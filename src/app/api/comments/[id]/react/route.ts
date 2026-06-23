import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

const ALLOWED = ["❤️", "😂", "🔥", "👍", "😮", "😢", "👏"];

/** Toggle/replace an emoji reaction on a comment. Body: { emoji } (defaults to ❤️). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: commentId } = await params;
  const body = await request.json().catch(() => ({}));
  const emoji = typeof body?.emoji === "string" && ALLOWED.includes(body.emoji) ? body.emoji : "❤️";

  const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { authorId: true } });
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const existing = await prisma.commentReaction.findUnique({
    where: { commentId_userId: { commentId, userId: session.user.id } },
  });

  let viewerReaction: string | null;
  if (existing && existing.emoji === emoji) {
    // same emoji → remove
    await prisma.commentReaction.delete({ where: { id: existing.id } });
    viewerReaction = null;
  } else if (existing) {
    // different emoji → switch
    await prisma.commentReaction.update({ where: { id: existing.id }, data: { emoji } });
    viewerReaction = emoji;
  } else {
    await prisma.commentReaction.create({ data: { commentId, userId: session.user.id, emoji } });
    viewerReaction = emoji;
    await createNotification({
      userId: comment.authorId,
      actorId: session.user.id,
      type: "POST_REACTION",
      message: `@${session.user.username} reacted ${emoji} to your comment`,
      link: "/feed",
    });
  }

  const all = await prisma.commentReaction.findMany({ where: { commentId }, select: { emoji: true } });
  const counts: Record<string, number> = {};
  for (const r of all) counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;

  return NextResponse.json({ viewerReaction, counts, total: all.length });
}
