import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validations/messages";
import { getIO } from "@/lib/socket-server";
import { createNotification } from "@/lib/notifications";

const userSelect = { id: true, username: true, name: true, image: true } as const;

async function assertParticipant(conversationId: string, userId: string) {
  return prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;
  const participant = await assertParticipant(conversationId, session.user.id);
  if (!participant) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 30), 100);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: { sender: { select: userSelect }, reactions: { select: { userId: true, emoji: true } } },
  });

  const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

  // Read receipts: latest time any other participant has read this conversation.
  const others = await prisma.conversationParticipant.findMany({
    where: { conversationId, userId: { not: session.user.id } },
    select: { lastReadAt: true },
  });
  const readByOthersAt = others.reduce<Date | null>((latest, p) => {
    if (!p.lastReadAt) return latest;
    return !latest || p.lastReadAt > latest ? p.lastReadAt : latest;
  }, null);

  return NextResponse.json({ messages: messages.reverse(), nextCursor, readByOthersAt });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;
  const participant = await assertParticipant(conversationId, session.user.id);
  if (!participant) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!parsed.data.content && !parsed.data.attachmentUrl) {
    return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content: parsed.data.content,
        attachmentUrl: parsed.data.attachmentUrl,
        attachmentType: parsed.data.attachmentType,
      },
      include: { sender: { select: userSelect } },
    }),
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: session.user.id } },
      data: { lastReadAt: new Date() },
    }),
  ]);

  getIO()?.to(`conversation:${conversationId}`).emit("message:new", message);

  // Notify the other participants (powers the notification bell + chat bubble badge).
  const others = await prisma.conversationParticipant.findMany({
    where: { conversationId, userId: { not: session.user.id } },
    select: { userId: true },
  });
  const preview = parsed.data.content
    ? parsed.data.content.slice(0, 80)
    : "Sent an attachment";
  await Promise.all(
    others.map((o) =>
      createNotification({
        userId: o.userId,
        actorId: session.user.id,
        type: "MESSAGE",
        message: `@${session.user.username}: ${preview}`,
        link: `/messages/${conversationId}`,
      }),
    ),
  );

  return NextResponse.json({ message });
}
