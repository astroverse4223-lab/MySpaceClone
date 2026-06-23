import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rsvpSchema } from "@/lib/validations/events";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const rsvp = await prisma.eventRsvp.upsert({
    where: { eventId_userId: { eventId, userId: session.user.id } },
    update: { status: parsed.data.status },
    create: { eventId, userId: session.user.id, status: parsed.data.status },
  });

  return NextResponse.json({ rsvp });
}
