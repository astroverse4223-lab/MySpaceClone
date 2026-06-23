"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function TrendingTags() {
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);

  useEffect(() => {
    fetch("/api/tags/trending")
      .then((res) => res.json())
      .then((json) => setTags(json.trending ?? []))
      .catch(() => {});
  }, []);

  if (tags.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="text-sm font-semibold">Trending 🔥</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((t) => (
          <Link
            key={t.tag}
            href={`/tags/${encodeURIComponent(t.tag)}`}
            className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10"
          >
            #{t.tag} <span className="text-white/40">{t.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
