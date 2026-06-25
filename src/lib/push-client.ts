// Browser-side helpers for Web Push. Shared by the settings toggle and the
// navbar nudge so the subscribe flow lives in exactly one place.

// If the build-time variable happens to be present we use it directly; if not
// (e.g. on Railway, where env vars only exist at runtime) we fall back to
// fetching the public key from /api/push/vapid-key.
const BUILD_TIME_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

let cachedKey: string | null | undefined; // undefined = not fetched yet

// The browser's PushManager wants the application server key as a Uint8Array.
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/** True if the browser itself has the APIs needed for Web Push. */
export function browserSupportsPush() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    window.isSecureContext
  );
}

/** Resolve the VAPID public key, preferring the build-time value, else fetching. */
export async function getVapidKey(): Promise<string | null> {
  if (BUILD_TIME_KEY) return BUILD_TIME_KEY;
  if (cachedKey !== undefined) return cachedKey;
  try {
    const res = await fetch("/api/push/vapid-key");
    const json = res.ok ? await res.json() : null;
    cachedKey = json && typeof json.key === "string" && json.key ? json.key : null;
  } catch {
    cachedKey = null;
  }
  return cachedKey ?? null;
}

export async function getExistingSubscription() {
  if (!browserSupportsPush()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/**
 * Ask permission, subscribe, and persist the subscription server-side.
 * Returns the resulting permission state so callers can react to a denial.
 * Throws "not-configured" if no VAPID key is available.
 */
export async function enablePush(): Promise<NotificationPermission> {
  if (!browserSupportsPush()) return "denied";

  const key = await getVapidKey();
  if (!key) throw new Error("not-configured");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  });

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  if (!res.ok) throw new Error("server rejected subscription");

  return "granted";
}

export async function disablePush() {
  if (!browserSupportsPush()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}
