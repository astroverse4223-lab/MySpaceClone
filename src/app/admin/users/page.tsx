"use client";

import { useEffect, useState } from "react";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string | null;
  role: string;
  isSuspended: boolean;
  suspendedReason: string | null;
  emailVerified: string | null;
  createdAt: string;
}

const BADGE_OPTIONS = [
  "founding_member",
  "first_post",
  "social_butterfly",
  "popular",
  "wordsmith",
  "tastemaker",
  "community_builder",
  "generous",
  "welcomed",
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [badgeChoice, setBadgeChoice] = useState(BADGE_OPTIONS[0]);

  async function load() {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    setUsers(json.users ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  }

  async function deleteUser(user: AdminUser) {
    if (!confirm(`Permanently delete @${user.username}? This removes all their data and cannot be undone.`)) return;
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    load();
  }

  async function badge(id: string, action: "grant" | "remove") {
    await fetch(`/api/admin/users/${id}/badge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge: badgeChoice, action }),
    });
    alert(`Badge ${action === "grant" ? "granted" : "removed"}: ${badgeChoice}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Users</h1>
      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
          placeholder="Search by username or email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button onClick={load} className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium hover:bg-violet-400">
          Search
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="text-sm text-white/40">Loading...</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {user.username}{" "}
                    {user.isSuspended && <span className="text-red-300">(suspended)</span>}
                    {!user.emailVerified && <span className="ml-1 text-amber-300">• unverified</span>}
                  </p>
                  <p className="text-xs text-white/40">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={user.role}
                    onChange={(e) => patch(user.id, { role: e.target.value })}
                    className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs"
                  >
                    <option value="USER">User</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button
                    onClick={() => patch(user.id, { isSuspended: !user.isSuspended })}
                    className={`rounded-lg border px-3 py-1 text-xs ${
                      user.isSuspended ? "border-emerald-500/30 text-emerald-300" : "border-red-500/30 text-red-300"
                    }`}
                  >
                    {user.isSuspended ? "Reinstate" : "Suspend"}
                  </button>
                  <button
                    onClick={() => setExpanded(expanded === user.id ? null : user.id)}
                    className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/5"
                  >
                    {expanded === user.id ? "Less" : "More"}
                  </button>
                </div>
              </div>

              {expanded === user.id && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                  <button
                    onClick={() => patch(user.id, { verifyEmail: !user.emailVerified })}
                    className="rounded-lg border border-white/15 px-3 py-1 text-xs text-white/80 hover:bg-white/5"
                  >
                    {user.emailVerified ? "Un-verify email" : "Force-verify email"}
                  </button>
                  <div className="flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1">
                    <select
                      value={badgeChoice}
                      onChange={(e) => setBadgeChoice(e.target.value)}
                      className="bg-transparent text-xs outline-none"
                    >
                      {BADGE_OPTIONS.map((b) => (
                        <option key={b} value={b} className="bg-[#0a0a0f]">
                          {b}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => badge(user.id, "grant")} className="text-xs text-emerald-300 hover:underline">
                      Grant
                    </button>
                    <span className="text-white/20">|</span>
                    <button onClick={() => badge(user.id, "remove")} className="text-xs text-amber-300 hover:underline">
                      Remove
                    </button>
                  </div>
                  <button
                    onClick={() => deleteUser(user)}
                    className="ml-auto rounded-lg border border-red-500/40 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Delete account
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
