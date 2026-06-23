import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }
  if (community.visibility === "PRIVATE") {
    return NextResponse.json({ error: "This community is private" }, { status: 403 });
  }

  const member = await prisma.communityMember.upsert({
    where: { communityId_userId: { communityId: community.id, userId: session.user.id } },
    update: {},
    create: { communityId: community.id, userId: session.user.id, role: "MEMBER" },
  });

  return NextResponse.json({ member });
}
