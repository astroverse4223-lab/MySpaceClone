import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePrivilegedAdmin, logAudit } from "@/lib/admin";
import { broadcastSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  const session = await requirePrivilegedAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = broadcastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const users = await prisma.user.findMany({ select: { id: true } });

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: "ANNOUNCEMENT" as const,
      message: parsed.data.message,
      link: parsed.data.link || null,
    })),
  });

  await logAudit(
    session.user.id,
    "broadcast.send",
    undefined,
    { message: parsed.data.message, recipients: users.length },
  );

  return NextResponse.json({ success: true, recipients: users.length });
}
