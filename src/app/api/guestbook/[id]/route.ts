import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Delete a guestbook entry. Allowed for the entry's author or the profile owner. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const entry = await prisma.guestbookEntry.findUnique({ where: { id } });
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (entry.authorId !== session.user.id && entry.profileUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.guestbookEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
