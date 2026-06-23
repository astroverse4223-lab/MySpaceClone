import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createGroupSchema } from "@/lib/validations/messages";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const members = await prisma.user.findMany({
    where: { username: { in: parsed.data.usernames } },
    select: { id: true },
  });

  if (members.length === 0) {
    return NextResponse.json({ error: "No valid members found" }, { status: 400 });
  }

  const participantIds = Array.from(new Set([session.user.id, ...members.map((m) => m.id)]));

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: parsed.data.name,
      participants: { create: participantIds.map((userId) => ({ userId })) },
    },
  });

  return NextResponse.json({ conversationId: conversation.id });
}
