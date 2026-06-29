import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePrivilegedAdmin, logAudit } from "@/lib/admin";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requirePrivilegedAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.bulletin.deleteMany({ where: { id } });

  await logAudit(session.user.id, "bulletin.delete", { type: "Bulletin", id });

  return NextResponse.json({ success: true });
}
