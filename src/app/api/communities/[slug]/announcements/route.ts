import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAnnouncementSchema } from "@/lib/validations/communities";
import { requireStaff } from "@/lib/communities";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const announcements = await prisma.communityAnnouncement.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, username: true, name: true, image: true } } },
  });

  return NextResponse.json({ announcements });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const staff = await requireStaff(community.id, session.user.id);
  if (!staff) {
    return NextResponse.json({ error: "Only moderators can post announcements" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createAnnouncementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const announcement = await prisma.communityAnnouncement.create({
    data: { communityId: community.id, authorId: session.user.id, content: parsed.data.content },
    include: { author: { select: { id: true, username: true, name: true, image: true } } },
  });

  return NextResponse.json({ announcement });
}
