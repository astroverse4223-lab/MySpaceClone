import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// VAPID keys identify this server to the browser push services. Generate a pair
// with `npx web-push generate-vapid-keys` and put them in your env. When they're
// missing (e.g. local dev) every helper here becomes a no-op instead of throwing,
// so push is purely additive and never breaks the action that triggered it.
const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT ?? process.env.APP_URL ?? "mailto:hello@myspacereborn.app";

let configured = false;
if (PUBLIC_KEY && PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    configured = true;
  } catch {
    configured = false;
  }
}

export function isPushConfigured() {
  return configured;
}

export type PushPayload = {
  title: string;
  body: string;
  /** Relative in-app URL opened when the notification is clicked. */
  url?: string;
  /** Avatar / image shown on the notification. */
  icon?: string;
  /** Collapses notifications that share a tag so we don't spam the user. */
  tag?: string;
};

/**
 * Send a push to every device a user has registered. Best-effort: failures are
 * swallowed, and subscriptions the push service reports as gone (404/410) are
 * pruned so we stop trying them.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!configured) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const body = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription expired or was revoked — drop it.
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }),
  );
}
