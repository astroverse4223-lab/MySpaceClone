import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const friendship = await prisma.friendship.findUnique({ where: { id } });

  if (!friendship || friendship.addresseeId !== session.user.id || friendship.status !== "PENDING") {
    return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
  }

  const updated = await prisma.friendship.update({
    where: { id },
    data: { status: "DECLINED", respondedAt: new Date() },
  });

  return NextResponse.json({ friendship: updated });
}
