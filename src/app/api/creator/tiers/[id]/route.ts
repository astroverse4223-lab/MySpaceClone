import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tier = await prisma.membershipTier.findUnique({ where: { id } });
  if (!tier || tier.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Tier not found" }, { status: 404 });
  }

  const activeCount = await prisma.subscription.count({ where: { tierId: id, status: "ACTIVE" } });
  if (activeCount > 0) {
    return NextResponse.json({ error: "Can't delete a tier with active subscribers" }, { status: 400 });
  }

  await prisma.membershipTier.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
