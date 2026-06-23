"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Analytics {
  userCount: number;
  newUsersThisWeek: number;
  postCount: number;
  reelCount: number;
  commentCount: number;
  communityCount: number;
  eventCount: number;
  articleCount: number;
  photoCount: number;
  messageCount: number;
  activeSubscriptionCount: number;
  mrrCents: number;
  pendingReports: number;
  suspendedUsers: number;
  dailySignups: { label: string; count: number }[];
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Analytics>();

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) {
    return <p className="text-white/60">Loading...</p>;
  }

  const stats = [
    { label: "Users", value: data.userCount, icon: "👥", accent: "from-violet-500/20" },
    { label: "New this week", value: data.newUsersThisWeek, icon: "✨", accent: "from-emerald-500/20" },
    { label: "Posts", value: data.postCount, icon: "📝", accent: "from-sky-500/20" },
    { label: "Reels", value: data.reelCount, icon: "🎬", accent: "from-pink-500/20" },
    { label: "Comments", value: data.commentCount, icon: "💬", accent: "from-amber-500/20" },
    { label: "Photos", value: data.photoCount, icon: "📷", accent: "from-rose-500/20" },
    { label: "Communities", value: data.communityCount, icon: "🏛️", accent: "from-indigo-500/20" },
    { label: "Events", value: data.eventCount, icon: "📅", accent: "from-teal-500/20" },
    { label: "Messages", value: data.messageCount, icon: "✉️", accent: "from-cyan-500/20" },
    { label: "Articles", value: data.articleCount, icon: "📰", accent: "from-fuchsia-500/20" },
    { label: "Active subs", value: data.activeSubscriptionCount, icon: "💳", accent: "from-lime-500/20" },
    { label: "MRR", value: `$${(data.mrrCents / 100).toFixed(2)}`, icon: "💰", accent: "from-green-500/20" },
  ];

  const maxSignup = Math.max(1, ...data.dailySignups.map((d) => d.count));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Overview</h1>
      <p className="mt-1 text-sm text-white/40">Everything happening across the site.</p>

      {/* Alerts */}
      {(data.pendingReports > 0 || data.suspendedUsers > 0) && (
        <div className="mt-5 flex flex-wrap gap-3">
          {data.pendingReports > 0 && (
            <Link
              href="/admin/reports"
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200 hover:bg-amber-500/20"
            >
              🚩 {data.pendingReports} pending {data.pendingReports === 1 ? "report" : "reports"} →
            </Link>
          )}
          {data.suspendedUsers > 0 && (
            <Link
              href="/admin/users"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/20"
            >
              ⛔ {data.suspendedUsers} suspended {data.suspendedUsers === 1 ? "user" : "users"} →
            </Link>
          )}
        </div>
      )}

      {/* Stat grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border border-white/10 bg-gradient-to-br ${stat.accent} to-transparent p-4`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/50">{stat.label}</p>
              <span>{stat.icon}</span>
            </div>
            <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Signups chart */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-medium text-white/70">New signups (last 7 days)</h2>
        <div className="mt-4 flex h-40 items-end gap-3">
          {data.dailySignups.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-violet-600 to-fuchsia-500 transition-all"
                  style={{ height: `${(d.count / maxSignup) * 100}%`, minHeight: d.count > 0 ? "6px" : "2px" }}
                  title={`${d.count} signups`}
                />
              </div>
              <span className="text-[10px] text-white/40">{d.label}</span>
              <span className="text-[10px] text-white/60">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-sm font-medium text-white/70">Quick actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/admin/users", label: "Manage users", icon: "👥" },
            { href: "/admin/content", label: "Moderate content", icon: "📝" },
            { href: "/admin/broadcast", label: "Send broadcast", icon: "📢" },
            { href: "/admin/reports", label: "Review reports", icon: "🚩" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-center transition hover:border-violet-400/40 hover:bg-white/10"
            >
              <div className="text-2xl">{a.icon}</div>
              <p className="mt-1 text-xs text-white/70">{a.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
