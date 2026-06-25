"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { enablePush, getExistingSubscription, pushSupported } from "@/lib/push-client";

const DISMISS_KEY = "push-nudge-dismissed";

/**
 * A small, dismissable prompt encouraging signed-in users to turn on push
 * notifications. Only shows when push is actually available and the user
 * hasn't already granted, blocked, dismissed, or subscribed.
 */
export function PushNudge() {
  const { status } = useSession();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!pushSupported()) return;
    // Only nudge when the user hasn't decided yet.
    if (Notification.permission !== "default") return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* localStorage unavailable — continue */
    }
    let cancelled = false;
    getExistingSubscription()
      .then((sub) => {
        if (!cancelled && !sub) setShow(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status]);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function turnOn() {
    setBusy(true);
    try {
      await enablePush();
    } catch {
      /* swallow — the settings page surfaces detailed errors */
    } finally {
      // Whether granted or denied, we're done nudging.
      dismiss();
      setBusy(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-[60] mx-auto max-w-md rounded-2xl border border-white/10 bg-[#13121c]/95 p-4 shadow-2xl backdrop-blur-xl sm:bottom-3 sm:left-3 sm:right-auto sm:mx-0">
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden>
          🔔
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Turn on notifications</p>
          <p className="mt-1 text-xs leading-relaxed text-white/60">
            Get pinged about friend requests, reactions and messages — even when MySpace is closed.
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-white/40 transition hover:text-white"
        >
          ✕
        </button>
      </div>
      <button
        onClick={turnOn}
        disabled={busy}
        className="mt-3 w-full rounded-xl bg-gradient-to-r from-violet-400 to-pink-400 px-4 py-2 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Enabling…" : "Enable notifications"}
      </button>
    </div>
  );
}
