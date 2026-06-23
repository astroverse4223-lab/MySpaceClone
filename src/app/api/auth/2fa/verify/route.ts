import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const code = body?.code as string | undefined;
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.twoFactorSecret) {
    return NextResponse.json({ error: "Run 2FA setup first" }, { status: 400 });
  }

  const valid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
  if (!valid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });

  return NextResponse.json({ success: true });
}
