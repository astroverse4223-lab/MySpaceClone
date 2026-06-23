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

  const membership = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId: session.user.id } },
  });

  if (membership?.role === "OWNER") {
    return NextResponse.json({ error: "Transfer ownership before leaving" }, { status: 400 });
  }

  await prisma.communityMember.deleteMany({
    where: { communityId: community.id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
