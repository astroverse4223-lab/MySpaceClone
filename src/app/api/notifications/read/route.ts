import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Mark notifications as read. Body `{ id }` marks one; empty body marks all.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : null;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false, ...(id ? { id } : {}) },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
