import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, entryId } = await params;
  const list = await prisma.friendList.findUnique({ where: { id } });
  if (!list || list.userId !== session.user.id) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  await prisma.friendListEntry.deleteMany({ where: { id: entryId, listId: id } });
  return NextResponse.json({ success: true });
}
