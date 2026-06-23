import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAlbumSchema } from "@/lib/validations/photos";

// GET /api/albums?username=foo  → that user's albums (with photos) + loose photos
export async function GET(request: Request) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username")?.trim();
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [albums, loosePhotos] = await Promise.all([
    prisma.album.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { photos: { orderBy: { createdAt: "desc" } } },
    }),
    prisma.photo.findMany({
      where: { userId: user.id, albumId: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ albums, loosePhotos });
}

// POST /api/albums  → create an album (owner)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createAlbumSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const album = await prisma.album.create({
    data: { userId: session.user.id, name: parsed.data.name, description: parsed.data.description },
    include: { photos: true },
  });

  return NextResponse.json({ album });
}
