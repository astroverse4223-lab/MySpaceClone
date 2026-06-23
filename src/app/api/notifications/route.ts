import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        actor: {
          select: { username: true, name: true, image: true, profile: { select: { avatarImage: true } } },
        },
      },
    }),
    prisma.notification.count({ where: { userId: session.user.id, read: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

/**
 * Dismiss notifications. Body `{ id }` removes one; empty body clears all.
 */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : null;

  await prisma.notification.deleteMany({
    where: { userId: session.user.id, ...(id ? { id } : {}) },
  });

  return NextResponse.json({ success: true });
}
