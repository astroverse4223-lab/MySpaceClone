import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; trackId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: playlistId, trackId } = await params;
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  if (!playlist || playlist.userId !== session.user.id) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  await prisma.playlistTrack.deleteMany({ where: { id: trackId, playlistId } });
  return NextResponse.json({ success: true });
}
