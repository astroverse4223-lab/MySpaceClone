"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePlayer } from "@/lib/player-store";

interface Tier {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  interval: string;
}

const TIP_PRESETS_CENTS = [300, 500, 1000];

export function MembershipSection({ username, tiers }: { username: string; tiers: Tier[] }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [tipLoading, setTipLoading] = useState(false);
  const playerActive = usePlayer((s) => s.queue.length > 0);

  useEffect(() => setMounted(true), []);

  async function subscribe(tierId: string) {
    setError(undefined);
    const res = await fetch("/api/creator/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tierId }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error);
      return;
    }
    window.location.href = json.url;
  }

  async function tip(amountCents: number) {
    setError(undefined);
    setTipLoading(true);
    const res = await fetch("/api/creator/tip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorUsername: username, amountCents }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error);
      setTipLoading(false);
      return;
    }
    window.location.href = json.url;
  }

  if (!mounted) return null;

  const bottomOffset = playerActive ? "bottom-24" : "safe-bottom-offset";

  return createPortal(
    <div className={`fixed left-4 z-50 sm:left-6 ${bottomOffset}`}>
      {open && (
        <div className="mb-3 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#0c0c14]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">
              {tiers.length > 0 ? `Support ${username}` : "Tip the site"}
            </span>
            <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white" aria-label="Close">
              ✕
            </button>
          </div>
          <p className="mt-1 text-xs text-white/40">
            {tiers.length > 0
              ? `Payments here go to MySpace Reborn itself, not directly to ${username}'s personal account.`
              : `Tips support MySpace Reborn itself, not ${username}'s personal account.`}
          </p>
          {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

          {tiers.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {tiers.map((tier) => (
                <div key={tier.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm font-medium">{tier.name}</p>
                  <p className="mt-1 text-base font-semibold">
                    ${(tier.priceCents / 100).toFixed(2)}
                    <span className="text-xs text-white/40">/{tier.interval.toLowerCase()}</span>
                  </p>
                  {tier.description && <p className="mt-1 text-xs text-white/50">{tier.description}</p>}
                  <button
                    onClick={() => subscribe(tier.id)}
                    className="mt-2 w-full rounded-lg bg-violet-500 px-3 py-2 text-sm font-medium hover:bg-violet-400"
                  >
                    Become a member
                  </button>
                </div>
              ))}
              <p className="mt-1 text-xs text-white/50">Or just leave a tip:</p>
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            {TIP_PRESETS_CENTS.map((cents) => (
              <button
                key={cents}
                disabled={tipLoading}
                onClick={() => tip(cents)}
                className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium hover:bg-violet-400 disabled:opacity-50"
              >
                Tip ${(cents / 100).toFixed(0)}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0c0c14]/95 px-4 py-2.5 text-sm font-medium text-white shadow-2xl shadow-black/50 backdrop-blur-xl hover:bg-[#16151f]"
      >
        💸 Tip
      </button>
    </div>,
    document.body,
  );
}
