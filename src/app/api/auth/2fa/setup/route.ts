import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = authenticator.generateSecret();
  const otpUrl = authenticator.keyuri(session.user.email ?? session.user.username, "MySpace Reborn", secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpUrl);

  // Store unconfirmed secret; twoFactorEnabled flips to true only after /2fa/verify succeeds.
  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: secret },
  });

  return NextResponse.json({ qrCodeDataUrl, secret });
}
