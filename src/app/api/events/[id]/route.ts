import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const authorSelect = { id: true, username: true, name: true, image: true } as const;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      createdBy: { select: authorSelect },
      rsvps: { include: { user: { select: authorSelect } } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event });
}
