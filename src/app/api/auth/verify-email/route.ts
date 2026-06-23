import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = body?.token as string | undefined;

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const verification = await prisma.emailVerificationToken.findUnique({ where: { token } });

  if (!verification || verification.expires < new Date()) {
    return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.delete({ where: { token } }),
  ]);

  return NextResponse.json({ success: true });
}
