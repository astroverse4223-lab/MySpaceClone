import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validations/events";

const authorSelect = { id: true, username: true, name: true, image: true } as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const communityId = url.searchParams.get("communityId") ?? undefined;

  const events = await prisma.event.findMany({
    where: { startsAt: { gte: new Date() }, ...(communityId ? { communityId } : {}) },
    orderBy: { startsAt: "asc" },
    include: { createdBy: { select: authorSelect }, _count: { select: { rsvps: true } } },
    take: 50,
  });

  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { startsAt, endsAt, ...rest } = parsed.data;

  const event = await prisma.event.create({
    data: {
      createdById: session.user.id,
      ...rest,
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : undefined,
      rsvps: { create: [{ userId: session.user.id, status: "GOING" }] },
    },
    include: { createdBy: { select: authorSelect } },
  });

  return NextResponse.json({ event });
}
