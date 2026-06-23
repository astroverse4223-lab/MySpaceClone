import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const communities = await prisma.community.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { username: true } },
      _count: { select: { members: true, posts: true } },
    },
  });

  return NextResponse.json({ communities });
}
