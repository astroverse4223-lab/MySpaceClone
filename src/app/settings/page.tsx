"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();

  const username = session?.user?.username;

  async function downloadData() {
    // Trigger the file download from the export endpoint.
    window.location.href = "/api/account/export";
  }

  async function deleteAccount() {
    setError(undefined);
    setDeleting(true);
    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: confirmText }),
    });
    if (res.ok) {
      await signOut({ callbackUrl: "/" });
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Could not delete account");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Account */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-medium text-white/60">Account</h2>
        <div className="mt-3 space-y-1 text-sm">
          <p className="text-white/80">
            Username: <span className="font-medium">@{username ?? "—"}</span>
          </p>
          <p className="text-white/80">
            Email: <span className="font-medium">{session?.user?.email ?? "—"}</span>
          </p>
        </div>
        {username && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/profile/edit" className="rounded-full bg-violet-500 px-4 py-1.5 text-sm font-medium hover:bg-violet-400">
              Edit profile
            </Link>
            <Link href={`/profile/${username}`} className="rounded-full border border-white/15 px-4 py-1.5 text-sm hover:bg-white/5">
              View my profile
            </Link>
          </div>
        )}
      </section>

      {/* Quick links */}
      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { href: "/settings/security", icon: "🔒", title: "Security & 2FA", desc: "Password & two-factor auth" },
          { href: "/friends/top-friends", icon: "⭐", title: "Top Friends", desc: "Curate your top friends" },
          { href: "/playlists", icon: "🎧", title: "Playlists", desc: "Manage your music" },
          { href: `/profile/${username ?? ""}/photos`, icon: "📷", title: "Photos", desc: "Your photo albums" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-violet-400/40 hover:bg-white/10"
          >
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-white/40">{item.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* Your data */}
      <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-medium text-white/60">Your data</h2>
        <p className="mt-2 text-sm text-white/50">
          Download a copy of everything you&apos;ve created — profile, posts, comments, photos, playlists and more.
        </p>
        <button
          onClick={downloadData}
          className="mt-3 rounded-full border border-white/15 px-4 py-1.5 text-sm hover:bg-white/5"
        >
          ⬇️ Download my data
        </button>
      </section>

      {/* Danger zone */}
      <section className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="text-sm font-medium text-red-300">Danger zone</h2>
        <p className="mt-2 text-sm text-white/50">
          Permanently delete your account and all of your data. This cannot be undone.
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="mt-3 rounded-full border border-red-500/40 px-4 py-1.5 text-sm text-red-300 hover:bg-red-500/10"
          >
            Delete my account
          </button>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-white/70">
              Type your username <span className="font-semibold">@{username}</span> to confirm:
            </p>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-red-400/60"
              placeholder={username}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
            {error && <p className="text-xs text-red-300">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  setConfirmText("");
                  setError(undefined);
                }}
                className="rounded-full border border-white/15 px-4 py-1.5 text-sm hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleting || confirmText !== username}
                className="rounded-full bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-400 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Permanently delete"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
