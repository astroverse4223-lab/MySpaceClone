import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { resendVerificationSchema } from "@/lib/validations/auth";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  if (!rateLimit(`resend-verification:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = resendVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });

  // Only send when the account exists and still needs verifying. Respond the same
  // way regardless, so this can't be used to probe which emails are registered.
  if (user && !user.emailVerified) {
    // Invalidate any earlier links so only the freshest one works.
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    try {
      await sendVerificationEmail(user.email, token);
    } catch (err) {
      // Log the real provider error server-side; return a generic message to the client.
      console.error("resend-verification: failed to send email", err);
      return NextResponse.json(
        { error: "Couldn't send the email right now. Please try again later." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ success: true });
}
