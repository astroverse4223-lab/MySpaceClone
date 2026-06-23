import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured } from "@/lib/stripe";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creatorId = session.user.id;

  const [activeSubscriptions, tips, posts, totalReactions, totalComments] = await Promise.all([
    prisma.subscription.findMany({
      where: { creatorId, status: "ACTIVE" },
      include: { tier: true },
    }),
    prisma.tip.aggregate({ where: { creatorId }, _sum: { amountCents: true }, _count: true }),
    prisma.post.count({ where: { authorId: creatorId } }),
    prisma.reaction.count({ where: { post: { authorId: creatorId } } }),
    prisma.comment.count({ where: { post: { authorId: creatorId } } }),
  ]);

  const mrrCents = activeSubscriptions.reduce((sum, s) => {
    const monthly = s.tier.interval === "YEAR" ? s.tier.priceCents / 12 : s.tier.priceCents;
    return sum + monthly;
  }, 0);

  return NextResponse.json({
    stripeConfigured: isStripeConfigured(),
    subscriberCount: activeSubscriptions.length,
    mrrCents: Math.round(mrrCents),
    totalTipCents: tips._sum.amountCents ?? 0,
    tipCount: tips._count,
    postCount: posts,
    totalReactions,
    totalComments,
  });
}
