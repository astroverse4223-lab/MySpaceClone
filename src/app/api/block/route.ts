import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/block { username } → toggle blocking that user.
// Blocking also tears down any follow relationship in both directions.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username : null;
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.id === session.user.id) {
    return NextResponse.json({ error: "You can't block yourself" }, { status: 400 });
  }

  const me = session.user.id;
  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: me, blockedId: target.id } },
  });

  let blocked: boolean;
  if (existing) {
    await prisma.block.delete({ where: { id: existing.id } });
    blocked = false;
  } else {
    await prisma.block.create({ data: { blockerId: me, blockedId: target.id } });
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: me, followingId: target.id },
          { followerId: target.id, followingId: me },
        ],
      },
    });
    blocked = true;
  }

  return NextResponse.json({ blocked });
}
