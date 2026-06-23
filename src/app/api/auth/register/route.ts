import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  if (!rateLimit(`register:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { email, username, password, name } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { username }] },
    select: { email: true, username: true },
  });

  if (existing) {
    const field = existing.email === normalizedEmail ? "email" : "username";
    return NextResponse.json({ error: `That ${field} is already taken.` }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      username,
      name,
      passwordHash,
      profile: { create: {} },
    },
  });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.emailVerificationToken.create({
    data: {
      token,
      userId: user.id,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendVerificationEmail(user.email, token);

  return NextResponse.json({ success: true });
}
