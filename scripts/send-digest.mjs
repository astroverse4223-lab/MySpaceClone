// Fires the notification-digest endpoint once, then exits. Meant to be run on a
// schedule — either by a Railway Cron service (start command: `node
// scripts/send-digest.mjs`) or any external scheduler that can run a command.
//
// Needs two env vars (already set on your service):
//   APP_URL      e.g. https://your-app.up.railway.app
//   CRON_SECRET  the same secret the endpoint checks
//
// It just makes the authenticated HTTP call; all the real work happens in the
// /api/cron/notification-digest route.

const base = process.env.APP_URL?.replace(/\/$/, "");
const secret = process.env.CRON_SECRET;

if (!base || !secret) {
  console.error("send-digest: APP_URL and CRON_SECRET must be set");
  process.exit(1);
}

try {
  const res = await fetch(`${base}/api/cron/notification-digest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`send-digest: endpoint returned ${res.status}: ${text}`);
    process.exit(1);
  }
  console.log(`send-digest: ok ${text}`);
} catch (err) {
  console.error("send-digest: request failed", err);
  process.exit(1);
}
