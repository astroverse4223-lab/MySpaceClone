import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateAlbumSchema } from "@/lib/validations/photos";

async function ownedAlbum(id: string, userId: string) {
  const album = await prisma.album.findUnique({ where: { id } });
  if (!album || album.userId !== userId) return null;
  return album;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!(await ownedAlbum(id, session.user.id))) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateAlbumSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const album = await prisma.album.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ album });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!(await ownedAlbum(id, session.user.id))) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  // Photos keep existing (albumId set to null via onDelete: SetNull) — they become loose photos.
  await prisma.album.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
