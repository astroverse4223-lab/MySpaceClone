"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BulletinType = "FEATURE" | "MAINTENANCE" | "UPDATE" | "GENERAL";

type Bulletin = {
  id: string;
  title: string;
  body: string;
  type: BulletinType;
  link: string | null;
  pinned: boolean;
};

const TYPE_META: Record<BulletinType, { emoji: string; classes: string }> = {
  FEATURE: { emoji: "✨", classes: "border-violet-400/40 bg-gradient-to-r from-violet-500/15 to-pink-500/10" },
  MAINTENANCE: { emoji: "🛠️", classes: "border-amber-400/40 bg-gradient-to-r from-amber-500/15 to-orange-500/10" },
  UPDATE: { emoji: "📢", classes: "border-sky-400/40 bg-gradient-to-r from-sky-500/15 to-cyan-500/10" },
  GENERAL: { emoji: "💬", classes: "border-white/20 bg-white/5" },
};

const DISMISS_KEY = "dismissed-bulletins";

export function BulletinBanner() {
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) setDismissed(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    fetch("/api/bulletins")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => json && setBulletins(json.bulletins))
      .catch(() => {});
  }, []);

  function dismiss(id: string) {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  const visible = bulletins.filter((b) => !dismissed.includes(b.id));
  if (visible.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {visible.map((b) => {
        const meta = TYPE_META[b.type];
        const content = (
          <div className={`flex items-start gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-xl ${meta.classes}`}>
            <span className="text-xl" aria-hidden>
              {meta.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{b.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/70">{b.body}</p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dismiss(b.id);
              }}
              aria-label="Dismiss"
              className="shrink-0 text-white/40 transition hover:text-white"
            >
              ✕
            </button>
          </div>
        );
        return b.link ? (
          <Link key={b.id} href={b.link} className="block transition hover:opacity-90">
            {content}
          </Link>
        ) : (
          <div key={b.id}>{content}</div>
        );
      })}
    </div>
  );
}
