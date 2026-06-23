import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addListEntrySchema } from "@/lib/validations/friends";
import { getAcceptedFriendIds } from "@/lib/friends";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const list = await prisma.friendList.findUnique({ where: { id } });
  if (!list || list.userId !== session.user.id) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = addListEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const friendIds = await getAcceptedFriendIds(session.user.id);
  if (!friendIds.has(parsed.data.friendUserId)) {
    return NextResponse.json({ error: "You can only add accepted friends to a list" }, { status: 400 });
  }

  const existing = await prisma.friendListEntry.findUnique({
    where: { listId_friendUserId: { listId: id, friendUserId: parsed.data.friendUserId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already in this list" }, { status: 409 });
  }

  const maxPosition = await prisma.friendListEntry.aggregate({
    where: { listId: id },
    _max: { position: true },
  });

  const entry = await prisma.friendListEntry.create({
    data: {
      listId: id,
      friendUserId: parsed.data.friendUserId,
      position: (maxPosition._max.position ?? -1) + 1,
    },
    include: { friendUser: { select: { id: true, username: true, name: true, image: true } } },
  });

  return NextResponse.json({ entry });
}
