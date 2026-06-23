import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startConversationSchema } from "@/lib/validations/messages";

const userSelect = { id: true, username: true, name: true, image: true } as const;

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const participations = await prisma.conversationParticipant.findMany({
    where: { userId: session.user.id },
    include: {
      conversation: {
        include: {
          participants: { include: { user: { select: userSelect } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const conversations = participations
    .map((p) => {
      const lastMessage = p.conversation.messages[0] ?? null;
      const unread = lastMessage && (!p.lastReadAt || lastMessage.createdAt > p.lastReadAt);
      return {
        id: p.conversation.id,
        isGroup: p.conversation.isGroup,
        name: p.conversation.name,
        participants: p.conversation.participants.map((cp) => cp.user).filter((u) => u.id !== session.user.id),
        lastMessage,
        unread: Boolean(unread),
        updatedAt: p.conversation.updatedAt,
      };
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = startConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.id === session.user.id) {
    return NextResponse.json({ error: "You can't message yourself" }, { status: 400 });
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      participants: { some: { userId: session.user.id } },
      AND: { participants: { some: { userId: target.id } } },
    },
    include: { participants: true },
  });

  if (existing && existing.participants.length === 2) {
    return NextResponse.json({ conversationId: existing.id });
  }

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [{ userId: session.user.id }, { userId: target.id }],
      },
    },
  });

  return NextResponse.json({ conversationId: conversation.id });
}
