import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addTrackSchema } from "@/lib/validations/music";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: playlistId } = await params;
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  if (!playlist || playlist.userId !== session.user.id) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = addTrackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const maxPosition = await prisma.playlistTrack.aggregate({
    where: { playlistId },
    _max: { position: true },
  });

  const track = await prisma.playlistTrack.create({
    data: { playlistId, ...parsed.data, position: (maxPosition._max.position ?? -1) + 1 },
  });

  return NextResponse.json({ track });
}
