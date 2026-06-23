import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reorderListSchema } from "@/lib/validations/friends";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const list = await prisma.friendList.findUnique({ where: { id }, include: { entries: true } });
  if (!list || list.userId !== session.user.id) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reorderListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const validIds = new Set(list.entries.map((e) => e.id));
  if (parsed.data.entryIds.length !== list.entries.length || !parsed.data.entryIds.every((eid) => validIds.has(eid))) {
    return NextResponse.json({ error: "entryIds must match the list's current entries" }, { status: 400 });
  }

  await prisma.$transaction(
    parsed.data.entryIds.map((entryId, index) =>
      prisma.friendListEntry.update({ where: { id: entryId }, data: { position: index } }),
    ),
  );

  return NextResponse.json({ success: true });
}
