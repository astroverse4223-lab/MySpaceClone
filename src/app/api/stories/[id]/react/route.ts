import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

const ALLOWED = ["❤️", "😂", "🔥", "👍", "😮", "😢", "👏", "🙌"];

// POST /api/stories/[id]/react { emoji } → toggle/replace a story reaction.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: storyId } = await params;
  const body = await request.json().catch(() => ({}));
  const emoji = typeof body?.emoji === "string" && ALLOWED.includes(body.emoji) ? body.emoji : "❤️";

  const story = await prisma.story.findUnique({ where: { id: storyId }, select: { authorId: true } });
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  const existing = await prisma.storyReaction.findUnique({
    where: { storyId_userId: { storyId, userId: session.user.id } },
  });

  let viewerReaction: string | null;
  if (existing && existing.emoji === emoji) {
    await prisma.storyReaction.delete({ where: { id: existing.id } });
    viewerReaction = null;
  } else if (existing) {
    await prisma.storyReaction.update({ where: { id: existing.id }, data: { emoji } });
    viewerReaction = emoji;
  } else {
    await prisma.storyReaction.create({ data: { storyId, userId: session.user.id, emoji } });
    viewerReaction = emoji;
    await createNotification({
      userId: story.authorId,
      actorId: session.user.id,
      type: "STORY_REACTION",
      message: `@${session.user.username} reacted ${emoji} to your story`,
      link: "/feed",
    });
  }

  return NextResponse.json({ viewerReaction });
}
