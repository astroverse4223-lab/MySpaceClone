"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/time";

type NotificationActor = {
  username: string;
  name: string | null;
  image: string | null;
  profile: { avatarImage: string | null } | null;
};

type NotificationItem = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
  actor: NotificationActor | null;
};

const TYPE_EMOJI: Record<string, string> = {
  FRIEND_REQUEST: "👋",
  FRIEND_ACCEPT: "🤝",
  POST_REACTION: "🔥",
  POST_COMMENT: "💬",
  COMMENT_REPLY: "↩️",
  GUESTBOOK: "📖",
  MESSAGE: "✉️",
  TIP: "💝",
  MENTION: "📣",
  BADGE: "🏅",
  PROFILE_VIEW: "👀",
  COMMUNITY: "🏛️",
  ANNOUNCEMENT: "📢",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.notifications ?? []);
      setUnread(json.unreadCount ?? 0);
    } catch {
      /* ignore polling errors */
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function dismiss(id: string) {
    setItems((prev) => prev.filter((n) => n.id !== id));
    setUnread((u) => Math.max(0, u - 1));
    // Actually remove it so it doesn't reappear on the next load.
    fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await load();
      setLoading(false);
      if (unread > 0) {
        setUnread(0);
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        fetch("/api/notifications/read", { method: "POST" }).catch(() => {});
      }
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c14]/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-white/40">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-white/40">
                Nothing yet — go make some noise. 🎉
              </p>
            ) : (
              items.map((n) => {
                const avatar = n.actor?.profile?.avatarImage ?? n.actor?.image;
                const inner = (
                  <div
                    className={`flex gap-3 px-4 py-3 transition hover:bg-white/5 ${
                      n.read ? "" : "bg-violet-500/10"
                    }`}
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-sm">
                      {avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span>{TYPE_EMOJI[n.type] ?? "🔔"}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-white/90">{n.message}</p>
                      <p className="mt-0.5 text-xs text-white/40">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-pink-500" />}
                  </div>
                );
                return n.link ? (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => {
                      setOpen(false);
                      dismiss(n.id);
                    }}
                    className="block"
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    onClick={() => dismiss(n.id)}
                    className="block w-full text-left"
                    title="Dismiss"
                  >
                    {inner}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
