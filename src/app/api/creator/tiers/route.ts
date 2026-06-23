import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTierSchema } from "@/lib/validations/creator";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const creator = await prisma.user.findUnique({ where: { username } });
  if (!creator) {
    return NextResponse.json({ tiers: [] });
  }

  const tiers = await prisma.membershipTier.findMany({
    where: { creatorId: creator.id },
    orderBy: { priceCents: "asc" },
    include: { _count: { select: { subscriptions: true } } },
  });

  return NextResponse.json({ tiers, stripeConfigured: isStripeConfigured() });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createTierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  let stripeProductId: string | undefined;
  let stripePriceId: string | undefined;

  if (isStripeConfigured()) {
    const stripe = getStripe();
    const product = await stripe.products.create({ name: `${parsed.data.name} (${session.user.username})` });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: parsed.data.priceCents,
      currency: "usd",
      recurring: { interval: parsed.data.interval === "MONTH" ? "month" : "year" },
    });
    stripeProductId = product.id;
    stripePriceId = price.id;
  }

  const tier = await prisma.membershipTier.create({
    data: {
      creatorId: session.user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      priceCents: parsed.data.priceCents,
      interval: parsed.data.interval,
      stripeProductId,
      stripePriceId,
    },
  });

  return NextResponse.json({ tier, stripeConfigured: isStripeConfigured() });
}
