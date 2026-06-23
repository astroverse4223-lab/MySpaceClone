import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket-server";

/** Toggle/change an emoji reaction on a message (one per user per message). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: messageId } = await params;
  const body = await request.json().catch(() => null);
  const emoji = typeof body?.emoji === "string" ? body.emoji.slice(0, 8) : null;
  if (!emoji) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { conversationId: true },
  });
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: message.conversationId, userId: session.user.id } },
  });
  if (!participant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId: { messageId, userId: session.user.id } },
  });

  if (existing && existing.emoji === emoji) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.messageReaction.upsert({
      where: { messageId_userId: { messageId, userId: session.user.id } },
      create: { messageId, userId: session.user.id, emoji },
      update: { emoji },
    });
  }

  const reactions = await prisma.messageReaction.findMany({
    where: { messageId },
    select: { userId: true, emoji: true },
  });

  getIO()?.to(`conversation:${message.conversationId}`).emit("message:reaction", { messageId, reactions });

  return NextResponse.json({ reactions });
}
