import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePrivilegedAdmin, logAudit } from "@/lib/admin";
import { grantBadgeSchema } from "@/lib/validations/admin";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requirePrivilegedAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = grantBadgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { badge, action } = parsed.data;

  if (action === "remove") {
    await prisma.userBadge.deleteMany({ where: { userId: id, badge } });
  } else {
    await prisma.userBadge
      .create({ data: { userId: id, badge } })
      .catch(() => null); // ignore duplicate
    await createNotification({
      userId: id,
      type: "BADGE",
      message: `You were awarded a badge: ${badge}`,
      link: "/profile",
    });
  }

  await logAudit(session.user.id, `badge.${action}`, { type: "USER", id }, { badge });
  return NextResponse.json({ success: true });
}
