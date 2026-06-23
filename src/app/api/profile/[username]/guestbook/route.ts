import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { guestbookEntrySchema } from "@/lib/validations/social";
import { createNotification } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";

const authorSelect = {
  id: true,
  username: true,
  name: true,
  image: true,
  profile: { select: { avatarImage: true, displayName: true } },
} as const;

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const entries = await prisma.guestbookEntry.findMany({
    where: { profileUserId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { author: { select: authorSelect } },
  });

  return NextResponse.json({ entries });
}

export async function POST(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`guestbook:${session.user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Slow down a little!" }, { status: 429 });
  }

  const { username } = await params;
  const owner = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!owner) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = guestbookEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const entry = await prisma.guestbookEntry.create({
    data: {
      profileUserId: owner.id,
      authorId: session.user.id,
      content: parsed.data.content,
    },
    include: { author: { select: authorSelect } },
  });

  await createNotification({
    userId: owner.id,
    actorId: session.user.id,
    type: "GUESTBOOK",
    message: `@${session.user.username} signed your guestbook`,
    link: `/profile/${username}`,
  });

  return NextResponse.json({ entry });
}
