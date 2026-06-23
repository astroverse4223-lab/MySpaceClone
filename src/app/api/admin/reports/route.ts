import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "PENDING";

  const reports = await prisma.report.findMany({
    where: { status: status as "PENDING" | "RESOLVED" | "DISMISSED" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: { select: { id: true, username: true, name: true } },
      resolvedBy: { select: { id: true, username: true } },
    },
  });

  return NextResponse.json({ reports });
}
