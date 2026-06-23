import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { renameFriendListSchema } from "@/lib/validations/friends";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const parsed = renameFriendListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.friendList.update({ where: { id }, data: { name: parsed.data.name } });
  return NextResponse.json({ list: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const list = await prisma.friendList.findUnique({ where: { id } });
  if (!list || list.userId !== session.user.id) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }
  if (list.isDefault) {
    return NextResponse.json({ error: "You can't delete your Top Friends list" }, { status: 400 });
  }

  await prisma.friendList.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
