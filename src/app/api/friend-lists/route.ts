import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createFriendListSchema } from "@/lib/validations/friends";
import { ensureDefaultFriendList } from "@/lib/friends";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureDefaultFriendList(session.user.id);

  const lists = await prisma.friendList.findMany({
    where: { userId: session.user.id },
    include: {
      entries: {
        orderBy: { position: "asc" },
        include: { friendUser: { select: { id: true, username: true, name: true, image: true } } },
      },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ lists });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createFriendListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.friendList.findUnique({
    where: { userId_name: { userId: session.user.id, name: parsed.data.name } },
  });
  if (existing) {
    return NextResponse.json({ error: "You already have a list with that name" }, { status: 409 });
  }

  const list = await prisma.friendList.create({
    data: { userId: session.user.id, name: parsed.data.name },
  });

  return NextResponse.json({ list });
}
