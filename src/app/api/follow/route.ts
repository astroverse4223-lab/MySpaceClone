import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// POST /api/follow { username } → toggle following that user.
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
    return NextResponse.json({ error: "You can't follow yourself" }, { status: 400 });
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId: target.id } },
  });

  let following: boolean;
  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    following = false;
  } else {
    await prisma.follow.create({ data: { followerId: session.user.id, followingId: target.id } });
    following = true;
    await createNotification({
      userId: target.id,
      actorId: session.user.id,
      type: "FOLLOW",
      message: `@${session.user.username} started following you`,
      link: `/profile/${session.user.username}`,
    });
  }

  const followerCount = await prisma.follow.count({ where: { followingId: target.id } });
  return NextResponse.json({ following, followerCount });
}
