"use client";

import { useEffect, useState } from "react";
import { disablePush, enablePush, getExistingSubscription, pushSupported } from "@/lib/push-client";

type State = "loading" | "unsupported" | "off" | "on" | "denied" | "busy";

export function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!pushSupported()) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    getExistingSubscription()
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  async function enable() {
    setError(undefined);
    setState("busy");
    try {
      const permission = await enablePush();
      if (permission === "granted") {
        setState("on");
      } else {
        setState(permission === "denied" ? "denied" : "off");
      }
    } catch {
      setError("Couldn't enable push notifications. Try again.");
      setState("off");
    }
  }

  async function disable() {
    setError(undefined);
    setState("busy");
    try {
      await disablePush();
      setState("off");
    } catch {
      setState("on");
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-sm font-medium text-white/60">Push notifications</h2>
      <p className="mt-2 text-sm text-white/50">
        Get notified about friend requests, reactions, comments and messages — even when the tab is
        closed.
      </p>

      <div className="mt-4">
        {state === "loading" && <p className="text-sm text-white/40">Checking…</p>}

        {state === "unsupported" && (
          <p className="text-sm text-white/40">
            Push isn&apos;t available in this browser. On iPhone, add the app to your Home Screen
            first.
          </p>
        )}

        {state === "denied" && (
          <p className="text-sm text-amber-300/80">
            Notifications are blocked. Re-enable them for this site in your browser settings, then
            reload.
          </p>
        )}

        {(state === "off" || state === "busy") && (
          <button
            onClick={enable}
            disabled={state === "busy"}
            className="rounded-full bg-violet-500 px-4 py-1.5 text-sm font-medium hover:bg-violet-400 disabled:opacity-50"
          >
            {state === "busy" ? "Working…" : "🔔 Enable push"}
          </button>
        )}

        {state === "on" && (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Enabled on this device
            </span>
            <button onClick={disable} className="text-sm text-white/40 hover:text-white/70">
              Turn off
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </section>
  );
}
