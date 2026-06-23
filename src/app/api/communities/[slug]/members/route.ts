import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const members = await prisma.communityMember.findMany({
    where: { communityId: community.id },
    orderBy: [{ points: "desc" }, { joinedAt: "asc" }],
    include: { user: { select: { id: true, username: true, name: true, image: true } } },
  });

  return NextResponse.json({ members });
}
