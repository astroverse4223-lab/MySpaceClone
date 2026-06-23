import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPhotoSchema } from "@/lib/validations/photos";

// POST /api/photos  → add a photo (owner), optionally into an album
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createPhotoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // If an album is given, it must belong to the user.
  if (parsed.data.albumId) {
    const album = await prisma.album.findUnique({ where: { id: parsed.data.albumId } });
    if (!album || album.userId !== session.user.id) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }
  }

  const photo = await prisma.photo.create({
    data: {
      userId: session.user.id,
      url: parsed.data.url,
      caption: parsed.data.caption,
      albumId: parsed.data.albumId ?? null,
    },
  });

  // Use the first photo as the album cover if it doesn't have one yet.
  if (parsed.data.albumId) {
    await prisma.album.updateMany({
      where: { id: parsed.data.albumId, coverImage: null },
      data: { coverImage: photo.url },
    });
  }

  return NextResponse.json({ photo });
}
