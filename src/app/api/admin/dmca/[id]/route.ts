import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAudit } from "@/lib/admin";
import { resolveDmcaSchema } from "@/lib/validations/admin";

async function takeDownContent(request: {
  contentType: string;
  contentUrl: string;
  targetUsername: string | null;
}): Promise<string | null> {
  if (request.contentType === "PROFILE_SONG" && request.targetUsername) {
    const user = await prisma.user.findUnique({ where: { username: request.targetUsername } });
    if (!user) return "No user found with that username.";
    await prisma.profile.updateMany({
      where: { userId: user.id },
      data: { profileSongUrl: null, profileSongTitle: null },
    });
    return null;
  }

  if (request.contentType === "PLAYLIST_TRACK") {
    const track = await prisma.playlistTrack.findFirst({ where: { externalUrl: request.contentUrl } });
    if (!track) return "No playlist track found with that URL.";
    await prisma.playlistTrack.delete({ where: { id: track.id } });
    return null;
  }

  return "Automatic takedown isn't supported for this content type — remove it from Content moderation.";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = resolveDmcaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.dmcaRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let takedownWarning: string | null = null;
  if (parsed.data.takedown && parsed.data.status === "RESOLVED") {
    takedownWarning = await takeDownContent(existing);
  }

  const dmcaRequest = await prisma.dmcaRequest.update({
    where: { id },
    data: { status: parsed.data.status, resolvedById: session.user.id, resolvedAt: new Date() },
  });

  await logAudit(session.user.id, `dmca.${parsed.data.status.toLowerCase()}`, { type: "DMCA_REQUEST", id }, {
    takedown: Boolean(parsed.data.takedown),
    takedownWarning,
  });

  return NextResponse.json({ dmcaRequest, takedownWarning });
}
