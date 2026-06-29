import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePrivilegedAdmin, logAudit } from "@/lib/admin";
import { createBulletinSchema } from "@/lib/validations/admin";

export async function GET() {
  const session = await requirePrivilegedAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const bulletins = await prisma.bulletin.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { username: true, name: true } } },
  });

  return NextResponse.json({ bulletins });
}

export async function POST(request: Request) {
  const session = await requirePrivilegedAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createBulletinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const bulletin = await prisma.bulletin.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      type: parsed.data.type,
      link: parsed.data.link || null,
      pinned: parsed.data.pinned ?? false,
      authorId: session.user.id,
    },
  });

  const users = await prisma.user.findMany({ select: { id: true } });
  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: "ANNOUNCEMENT" as const,
      message: `${parsed.data.title} — ${parsed.data.body}`,
      link: parsed.data.link || null,
    })),
  });

  await logAudit(session.user.id, "bulletin.create", { type: "Bulletin", id: bulletin.id }, {
    title: bulletin.title,
    type: bulletin.type,
    recipients: users.length,
  });

  return NextResponse.json({ bulletin, recipients: users.length });
}
