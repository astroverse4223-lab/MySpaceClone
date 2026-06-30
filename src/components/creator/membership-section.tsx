"use client";

import { useState } from "react";

interface Tier {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  interval: string;
}

const TIP_PRESETS_CENTS = [300, 500, 1000];

export function MembershipSection({ username, tiers }: { username: string; tiers: Tier[] }) {
  const [error, setError] = useState<string>();
  const [tipLoading, setTipLoading] = useState(false);

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

  if (tiers.length === 0) {
    return (
      <section>
        <h2 className="text-sm font-medium text-white/50">Support {username}</h2>
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
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
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-sm font-medium text-white/50">Support {username}</h2>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {tiers.map((tier) => (
          <div key={tier.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="font-medium">{tier.name}</p>
            <p className="mt-1 text-lg font-semibold">
              ${(tier.priceCents / 100).toFixed(2)}
              <span className="text-xs text-white/40">/{tier.interval.toLowerCase()}</span>
            </p>
            {tier.description && <p className="mt-1 text-xs text-white/50">{tier.description}</p>}
            <button
              onClick={() => subscribe(tier.id)}
              className="mt-3 w-full rounded-lg bg-violet-500 px-3 py-2 text-sm font-medium hover:bg-violet-400"
            >
              Become a member
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {TIP_PRESETS_CENTS.map((cents) => (
          <button
            key={cents}
            disabled={tipLoading}
            onClick={() => tip(cents)}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 disabled:opacity-50"
          >
            Tip ${(cents / 100).toFixed(0)}
          </button>
        ))}
      </div>
    </section>
  );
}
