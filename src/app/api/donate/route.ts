import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { donateSchema } from "@/lib/validations/donate";
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
  const parsed = donateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: parsed.data.amountCents,
          product_data: { name: "Donation to MySpace Reborn" },
        },
        quantity: 1,
      },
    ],
    customer_email: session.user.email ?? undefined,
    success_url: `${process.env.APP_URL}/donate?status=success`,
    cancel_url: `${process.env.APP_URL}/donate?status=cancelled`,
    metadata: {
      type: "donation",
      donorId: session.user.id,
      message: parsed.data.message ?? "",
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
