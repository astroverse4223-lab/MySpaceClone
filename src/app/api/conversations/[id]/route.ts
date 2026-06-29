import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: session.user.id } },
  });
  if (!participant) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Leaving removes the conversation from this user's inbox only. Once every
  // participant has left, nothing references it anymore, so drop it entirely
  // (cascades to remaining participants/messages).
  await prisma.conversationParticipant.delete({ where: { id: participant.id } });

  const remaining = await prisma.conversationParticipant.count({ where: { conversationId } });
  if (remaining === 0) {
    await prisma.conversation.delete({ where: { id: conversationId } });
  }

  return NextResponse.json({ ok: true });
}
