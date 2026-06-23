import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAudit } from "@/lib/admin";

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await params;
  await prisma.article.delete({ where: { slug } }).catch(() => null);

  await logAudit(session.user.id, "article.remove", { type: "ARTICLE", id: slug });

  return NextResponse.json({ success: true });
}
