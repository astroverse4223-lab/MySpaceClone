import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tipSchema } from "@/lib/validations/creator";
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
  const parsed = tipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const creator = await prisma.user.findUnique({ where: { username: parsed.data.creatorUsername } });
  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }
  if (creator.id === session.user.id) {
    return NextResponse.json({ error: "You can't tip yourself" }, { status: 400 });
  }

  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: parsed.data.amountCents,
          product_data: { name: `Tip for ${creator.username}` },
        },
        quantity: 1,
      },
    ],
    customer_email: session.user.email ?? undefined,
    success_url: `${process.env.APP_URL}/profile/${creator.username}?tip=success`,
    cancel_url: `${process.env.APP_URL}/profile/${creator.username}?tip=cancelled`,
    metadata: {
      type: "tip",
      senderId: session.user.id,
      creatorId: creator.id,
      message: parsed.data.message ?? "",
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
