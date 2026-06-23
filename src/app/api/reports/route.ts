import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createReportSchema } from "@/lib/validations/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`report:${session.user.id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many reports. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const report = await prisma.report.create({
    data: { reporterId: session.user.id, ...parsed.data },
  });

  return NextResponse.json({ report });
}
