import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      subscriber: { select: { username: true } },
      creator: { select: { username: true } },
      tier: { select: { name: true, priceCents: true, interval: true } },
    },
  });

  return NextResponse.json({ subscriptions });
}
