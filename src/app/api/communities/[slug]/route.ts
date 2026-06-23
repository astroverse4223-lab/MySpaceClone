import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateCommunitySchema } from "@/lib/validations/communities";
import { getMembership, requireStaff } from "@/lib/communities";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;

  const community = await prisma.community.findUnique({
    where: { slug },
    include: { _count: { select: { members: true, posts: true } } },
  });

  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const membership = session?.user ? await getMembership(community.id, session.user.id) : null;

  return NextResponse.json({ community, membership });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
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
    return NextResponse.json({ error: "Only moderators can edit this community" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCommunitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.community.update({ where: { slug }, data: parsed.data });
  return NextResponse.json({ community: updated });
}
