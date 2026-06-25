import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Register a browser PushSubscription for the signed-in user. The subscription
 * is keyed by its (globally unique) endpoint, so re-subscribing on the same
 * device just refreshes the stored keys instead of creating duplicates.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const endpoint: unknown = body?.endpoint;
  const p256dh: unknown = body?.keys?.p256dh;
  const authKey: unknown = body?.keys?.auth;

  if (
    typeof endpoint !== "string" ||
    typeof p256dh !== "string" ||
    typeof authKey !== "string"
  ) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 255) ?? null;

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: session.user.id, endpoint, p256dh, auth: authKey, userAgent },
    update: { userId: session.user.id, p256dh, auth: authKey, userAgent },
  });

  return NextResponse.json({ success: true });
}

/** Remove a subscription (e.g. the user turned push off in settings). */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const endpoint: unknown = body?.endpoint;

  await prisma.pushSubscription.deleteMany({
    where: {
      userId: session.user.id,
      ...(typeof endpoint === "string" ? { endpoint } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
