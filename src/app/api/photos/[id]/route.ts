import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo || photo.userId !== session.user.id) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  await prisma.photo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
