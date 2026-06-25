"use client";

import { useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/time";
import type { ActivityItem, ActivityKind } from "@/lib/activity";

const KIND_EMOJI: Record<ActivityKind, string> = {
  post: "📝",
  photo: "📷",
  article: "✍️",
  event: "📅",
  playlist: "🎧",
  friendship: "🤝",
  mood: "💭",
};

function displayName(actor: ActivityItem["actor"]) {
  return actor.name?.trim() || actor.username;
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const avatar = item.actor.avatarImage ?? item.actor.image;
  return (
    <Link
      href={item.link}
      className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-violet-400/40 hover:bg-white/10"
    >
      <div className="relative shrink-0">
        <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-white/10 text-sm">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            displayName(item.actor)[0]?.toUpperCase()
          )}
        </span>
        <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-[#13121c] text-[11px]">
          {KIND_EMOJI[item.kind]}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-white/90">
          <span className="font-semibold">{displayName(item.actor)}</span>{" "}
          <span className="text-white/60">{item.text}</span>
        </p>
        {item.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-white/50">{item.excerpt}</p>
        )}
        <p className="mt-1 text-xs text-white/35">{timeAgo(item.createdAt)}</p>
      </div>

      {item.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt=""
          className="h-16 w-16 shrink-0 rounded-xl object-cover"
        />
      )}
    </Link>
  );
}

export function ActivityList({
  initialItems,
  initialCursor,
}: {
  initialItems: ActivityItem[];
  initialCursor: string | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/activity?before=${encodeURIComponent(cursor)}`);
      if (res.ok) {
        const json = await res.json();
        setItems((prev) => [...prev, ...(json.items as ActivityItem[])]);
        setCursor(json.nextCursor as string | null);
      }
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
        <p className="text-3xl">🌱</p>
        <p className="mt-3 text-sm text-white/60">
          Nothing here yet. Add some friends or follow people, and their latest posts, photos and
          updates will show up here.
        </p>
        <Link
          href="/friends"
          className="mt-4 inline-block rounded-full bg-violet-500 px-4 py-1.5 text-sm font-medium hover:bg-violet-400"
        >
          Find people
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ActivityRow key={item.id} item={item} />
      ))}

      {cursor && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white/60 transition hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
