import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPlaylistSchema } from "@/lib/validations/music";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const playlists = await prisma.playlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { tracks: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json({ playlists });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createPlaylistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const playlist = await prisma.playlist.create({
    data: { userId: session.user.id, ...parsed.data },
    include: { tracks: true },
  });

  return NextResponse.json({ playlist });
}
