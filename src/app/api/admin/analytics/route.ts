import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    userCount,
    newUsersThisWeek,
    postCount,
    reelCount,
    commentCount,
    communityCount,
    eventCount,
    articleCount,
    photoCount,
    messageCount,
    activeSubscriptions,
    pendingReports,
    suspendedUsers,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.post.count(),
    prisma.post.count({ where: { isReel: true } }),
    prisma.comment.count(),
    prisma.community.count(),
    prisma.event.count(),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.photo.count(),
    prisma.message.count(),
    prisma.subscription.findMany({ where: { status: "ACTIVE" }, include: { tier: true } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { isSuspended: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { createdAt: true } }),
  ]);

  const mrrCents = activeSubscriptions.reduce((sum, s) => {
    const monthly = s.tier.interval === "YEAR" ? s.tier.priceCents / 12 : s.tier.priceCents;
    return sum + monthly;
  }, 0);

  // Daily signups for the last 7 days (index 0 = 6 days ago ... 6 = today).
  const dailySignups = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - (6 - i));
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const count = recentUsers.filter((u) => u.createdAt >= dayStart && u.createdAt < dayEnd).length;
    return { label: dayStart.toLocaleDateString(undefined, { weekday: "short" }), count };
  });

  return NextResponse.json({
    userCount,
    newUsersThisWeek,
    postCount,
    reelCount,
    commentCount,
    communityCount,
    eventCount,
    articleCount,
    photoCount,
    messageCount,
    activeSubscriptionCount: activeSubscriptions.length,
    mrrCents: Math.round(mrrCents),
    pendingReports,
    suspendedUsers,
    dailySignups,
  });
}
