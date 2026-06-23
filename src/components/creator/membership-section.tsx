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
  const [tipAmount, setTipAmount] = useState("5");
  const [tipMessage, setTipMessage] = useState("");

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

  async function sendTip() {
    setError(undefined);
    const amountCents = Math.round(parseFloat(tipAmount) * 100);
    const res = await fetch("/api/creator/tip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorUsername: username, amountCents, message: tipMessage || undefined }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error);
      return;
    }
    window.location.href = json.url;
  }

  return (
    <section>
      <h2 className="text-sm font-medium text-white/50">Support {username}</h2>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

      {tiers.length > 0 && (
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
      )}

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
        <span className="text-sm text-white/60">$</span>
        <input
          type="number"
          min="1"
          step="1"
          className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm outline-none focus:border-violet-400/60"
          value={tipAmount}
          onChange={(e) => setTipAmount(e.target.value)}
        />
        <input
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm outline-none focus:border-violet-400/60"
          placeholder="Message (optional)"
          value={tipMessage}
          onChange={(e) => setTipMessage(e.target.value)}
        />
        <button onClick={sendTip} className="rounded-lg bg-violet-500 px-3 py-1.5 text-sm font-medium hover:bg-violet-400">
          Tip
        </button>
      </div>
    </section>
  );
}
