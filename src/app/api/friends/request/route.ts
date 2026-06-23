import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendFriendRequestSchema } from "@/lib/validations/friends";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sendFriendRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.id === session.user.id) {
    return NextResponse.json({ error: "You can't friend yourself" }, { status: 400 });
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: session.user.id, addresseeId: target.id },
        { requesterId: target.id, addresseeId: session.user.id },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") {
      return NextResponse.json({ error: "You're already friends" }, { status: 409 });
    }
    if (existing.status === "PENDING") {
      return NextResponse.json({ error: "A friend request is already pending" }, { status: 409 });
    }
  }

  const friendship = existing
    ? await prisma.friendship.update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          requesterId: session.user.id,
          addresseeId: target.id,
          respondedAt: null,
        },
      })
    : await prisma.friendship.create({
        data: { requesterId: session.user.id, addresseeId: target.id },
      });

  await createNotification({
    userId: target.id,
    actorId: session.user.id,
    type: "FRIEND_REQUEST",
    message: `@${session.user.username} sent you a friend request`,
    link: "/friends",
  });

  return NextResponse.json({ friendship });
}
