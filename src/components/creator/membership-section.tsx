"use client";

import { useState } from "react";

interface Tier {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  interval: string;
}

export function MembershipSection({ username, tiers }: { username: string; tiers: Tier[] }) {
  const [error, setError] = useState<string>();

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

  // Tipping was pulled from here — money had nowhere to go until creator payouts
  // (Stripe Connect) exist. Membership tiers stay since a creator opts into those
  // deliberately. See /donate for supporting the site itself in the meantime.
  if (tiers.length === 0) return null;

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
    </section>
  );
}
