"use client";

import { useState } from "react";
import Link from "next/link";

type Person = {
  username: string;
  name: string | null;
  avatar: string | null;
  headline: string | null;
};

export function SuggestedPeople({ people }: { people: Person[] }) {
  const [sent, setSent] = useState<Record<string, "pending" | "sent" | "error">>({});

  async function add(username: string) {
    setSent((s) => ({ ...s, [username]: "pending" }));
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      setSent((s) => ({ ...s, [username]: res.ok ? "sent" : "error" }));
    } catch {
      setSent((s) => ({ ...s, [username]: "error" }));
    }
  }

  if (people.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="text-sm font-semibold">People to meet 👋</h3>
      <div className="mt-3 space-y-3">
        {people.map((p) => {
          const state = sent[p.username];
          return (
            <div key={p.username} className="flex items-center gap-3">
              <Link
                href={`/profile/${p.username}`}
                className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-sm font-semibold"
              >
                {p.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  (p.name ?? p.username)[0]?.toUpperCase()
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/profile/${p.username}`} className="block truncate text-sm font-medium hover:underline">
                  {p.name ?? p.username}
                </Link>
                <p className="truncate text-xs text-white/40">{p.headline ?? `@${p.username}`}</p>
              </div>
              <button
                onClick={() => add(p.username)}
                disabled={state === "pending" || state === "sent"}
                className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-xs font-medium transition hover:bg-white/10 disabled:opacity-50"
              >
                {state === "sent" ? "Sent ✓" : state === "pending" ? "…" : state === "error" ? "Retry" : "+ Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
