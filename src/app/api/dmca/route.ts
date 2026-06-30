import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { submitDmcaSchema } from "@/lib/validations/dmca";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  if (!rateLimit(`dmca:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = submitDmcaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { goodFaithStatement: _goodFaithStatement, accuracyStatement: _accuracyStatement, ...data } = parsed.data;

  await prisma.dmcaRequest.create({ data });

  return NextResponse.json({ success: true });
}
