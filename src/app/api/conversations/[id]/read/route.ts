import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket-server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;
  const readAt = new Date();
  const updated = await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: session.user.id },
    data: { lastReadAt: readAt },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Let the other participants' open chats move their "Seen" marker live.
  getIO()
    ?.to(`conversation:${conversationId}`)
    .emit("conversation:read", { conversationId, userId: session.user.id, readAt: readAt.toISOString() });

  return NextResponse.json({ success: true });
}
