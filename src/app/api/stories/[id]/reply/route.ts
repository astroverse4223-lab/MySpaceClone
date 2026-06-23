import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket-server";
import { createNotification } from "@/lib/notifications";

const userSelect = { id: true, username: true, name: true, image: true } as const;

// POST /api/stories/[id]/reply { text, emoji? } → DM the story author a reply,
// attaching the story's photo and any reaction (Instagram-style).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: storyId } = await params;
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const emoji = typeof body?.emoji === "string" ? body.emoji : "";
  if (!text && !emoji) {
    return NextResponse.json({ error: "Reply can't be empty" }, { status: 400 });
  }

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { authorId: true, type: true, mediaUrl: true },
  });
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  if (story.authorId === session.user.id) {
    return NextResponse.json({ error: "You can't reply to your own story" }, { status: 400 });
  }

  // Find or create a 1:1 conversation with the author.
  let conversation = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      participants: { some: { userId: session.user.id } },
      AND: { participants: { some: { userId: story.authorId } } },
    },
    include: { participants: true },
  });

  if (!conversation || conversation.participants.length !== 2) {
    conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: { create: [{ userId: session.user.id }, { userId: story.authorId }] },
      },
      include: { participants: true },
    });
  }

  const parts = ["↪️ Replied to your story:"];
  if (emoji) parts.push(emoji);
  if (text) parts.push(text);
  const content = parts.join(" ");

  // Attach the story image so the recipient sees what's being replied to.
  const isImage = story.type === "PHOTO" && story.mediaUrl;

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: session.user.id,
      content,
      attachmentUrl: isImage ? story.mediaUrl : null,
      attachmentType: isImage ? "IMAGE" : null,
    },
    include: { sender: { select: userSelect } },
  });
  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

  getIO()?.to(`conversation:${conversation.id}`).emit("message:new", message);
  await createNotification({
    userId: story.authorId,
    actorId: session.user.id,
    type: "MESSAGE",
    message: `@${session.user.username}: ${content.slice(0, 80)}`,
    link: `/messages/${conversation.id}`,
  });

  return NextResponse.json({ success: true, conversationId: conversation.id });
}
