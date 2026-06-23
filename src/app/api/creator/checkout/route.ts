import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations/creator";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments aren't configured yet. Add a STRIPE_SECRET_KEY to enable real checkout." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const tier = await prisma.membershipTier.findUnique({ where: { id: parsed.data.tierId } });
  if (!tier || !tier.stripePriceId) {
    return NextResponse.json({ error: "Tier not found" }, { status: 404 });
  }
  if (tier.creatorId === session.user.id) {
    return NextResponse.json({ error: "You can't subscribe to yourself" }, { status: 400 });
  }

  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: tier.stripePriceId, quantity: 1 }],
    customer_email: session.user.email ?? undefined,
    success_url: `${process.env.APP_URL}/creator/${tier.creatorId}?checkout=success`,
    cancel_url: `${process.env.APP_URL}/creator/${tier.creatorId}?checkout=cancelled`,
    metadata: { subscriberId: session.user.id, creatorId: tier.creatorId, tierId: tier.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
