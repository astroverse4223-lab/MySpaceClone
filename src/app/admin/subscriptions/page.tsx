"use client";

import { useEffect, useState } from "react";

interface SubscriptionRow {
  id: string;
  status: string;
  createdAt: string;
  subscriber: { username: string };
  creator: { username: string };
  tier: { name: string; priceCents: number; interval: string };
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then((res) => res.json())
      .then((json) => {
        setSubscriptions(json.subscriptions ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Subscriptions</h1>
      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="text-sm text-white/40">Loading...</p>
        ) : subscriptions.length === 0 ? (
          <p className="text-sm text-white/40">No subscriptions yet.</p>
        ) : (
          subscriptions.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-sm">
                {s.subscriber.username} → {s.creator.username} ({s.tier.name})
              </p>
              <div className="text-right">
                <p className="text-sm">
                  ${(s.tier.priceCents / 100).toFixed(2)}/{s.tier.interval.toLowerCase()}
                </p>
                <p
                  className={`text-xs ${
                    s.status === "ACTIVE" ? "text-emerald-300" : s.status === "PAST_DUE" ? "text-yellow-300" : "text-white/40"
                  }`}
                >
                  {s.status}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
