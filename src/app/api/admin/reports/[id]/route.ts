import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAudit } from "@/lib/admin";
import { resolveReportSchema } from "@/lib/validations/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = resolveReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const report = await prisma.report.update({
    where: { id },
    data: { status: parsed.data.status, resolvedById: session.user.id, resolvedAt: new Date() },
  });

  await logAudit(session.user.id, `report.${parsed.data.status.toLowerCase()}`, { type: "REPORT", id });

  return NextResponse.json({ report });
}
