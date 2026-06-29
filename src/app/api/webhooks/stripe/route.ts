import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhooks aren't configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const metadata = checkoutSession.metadata ?? {};

      if (metadata.type === "tip") {
        await prisma.tip.create({
          data: {
            senderId: metadata.senderId,
            creatorId: metadata.creatorId,
            amountCents: checkoutSession.amount_total ?? 0,
            message: metadata.message || undefined,
            stripePaymentIntentId:
              typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : undefined,
          },
        });
      } else if (metadata.type === "donation") {
        await prisma.donation.create({
          data: {
            donorId: metadata.donorId || undefined,
            amountCents: checkoutSession.amount_total ?? 0,
            message: metadata.message || undefined,
            stripePaymentIntentId:
              typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : undefined,
          },
        });
      } else if (metadata.tierId && checkoutSession.subscription) {
        await prisma.subscription.upsert({
          where: { subscriberId_creatorId: { subscriberId: metadata.subscriberId, creatorId: metadata.creatorId } },
          update: {
            tierId: metadata.tierId,
            status: "ACTIVE",
            stripeSubscriptionId:
              typeof checkoutSession.subscription === "string" ? checkoutSession.subscription : undefined,
            stripeCustomerId: typeof checkoutSession.customer === "string" ? checkoutSession.customer : undefined,
          },
          create: {
            subscriberId: metadata.subscriberId,
            creatorId: metadata.creatorId,
            tierId: metadata.tierId,
            status: "ACTIVE",
            stripeSubscriptionId:
              typeof checkoutSession.subscription === "string" ? checkoutSession.subscription : undefined,
            stripeCustomerId: typeof checkoutSession.customer === "string" ? checkoutSession.customer : undefined,
          },
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const status =
        sub.status === "active"
          ? "ACTIVE"
          : sub.status === "past_due"
            ? "PAST_DUE"
            : sub.status === "canceled" || event.type === "customer.subscription.deleted"
              ? "CANCELED"
              : "INCOMPLETE";

      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status,
          currentPeriodEnd: sub.items.data[0]?.current_period_end
            ? new Date(sub.items.data[0].current_period_end * 1000)
            : undefined,
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
