import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDigestEmail } from "@/lib/email";

// Emails users a summary of the in-app notifications they haven't seen yet.
// Designed to be hit by a scheduler (Vercel Cron, GitHub Actions, etc.) on an
// interval — say once a day. Protect it with CRON_SECRET so randoms can't spam
// your users: send `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>`.

export const dynamic = "force-dynamic";

const MAX_USERS_PER_RUN = 500;
const MAX_LINES = 6;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // Refuse to run unguarded.
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Candidate recipients: opted in, with a verified email, who have unread
  // notifications they weren't already digested about.
  const users = await prisma.user.findMany({
    where: {
      emailDigest: true,
      emailVerified: { not: null },
      isSuspended: false,
      // Has at least one unread notification. We refine "newer than the last
      // digest" per-user below, where we can compare against their watermark.
      notifications: { some: { read: false } },
    },
    select: { id: true, email: true, username: true, lastDigestAt: true },
    take: MAX_USERS_PER_RUN,
  });

  let sent = 0;

  for (const user of users) {
    const since = user.lastDigestAt ?? new Date(0);
    const [count, recent] = await Promise.all([
      prisma.notification.count({
        where: { userId: user.id, read: false, createdAt: { gt: since } },
      }),
      prisma.notification.findMany({
        where: { userId: user.id, read: false, createdAt: { gt: since } },
        orderBy: { createdAt: "desc" },
        take: MAX_LINES,
        select: { message: true },
      }),
    ]);

    if (count === 0) continue;

    try {
      await sendDigestEmail(user.email, {
        count,
        username: user.username,
        lines: recent.map((n) => n.message ?? "Something new happened"),
      });
      // Advance the watermark so we never re-send the same notifications.
      await prisma.user.update({
        where: { id: user.id },
        data: { lastDigestAt: new Date() },
      });
      sent++;
    } catch {
      // Skip this user on failure; they'll be retried next run.
    }
  }

  return NextResponse.json({ candidates: users.length, sent });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
