import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validations/profile";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const [profile] = await prisma.$transaction([
    prisma.profile.update({
      where: { userId: session.user.id },
      data: parsed.data,
    }),
    ...(parsed.data.avatarImage !== undefined
      ? [
          prisma.user.update({
            where: { id: session.user.id },
            data: { image: parsed.data.avatarImage || null },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ profile });
}
