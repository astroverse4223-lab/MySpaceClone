"use client";

import { useState } from "react";

export function ProfileActions({
  username,
  accent,
  initialFollowing,
  initialBlocked,
}: {
  username: string;
  accent: string;
  initialFollowing: boolean;
  initialBlocked: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleFollow() {
    setBusy(true);
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (res.ok) setFollowing((await res.json()).following);
    setBusy(false);
  }

  async function toggleBlock() {
    setMenuOpen(false);
    const res = await fetch("/api/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (res.ok) {
      const json = await res.json();
      setBlocked(json.blocked);
      if (json.blocked) setFollowing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!blocked && (
        <button
          onClick={toggleFollow}
          disabled={busy}
          className="rounded-full px-4 py-1.5 text-sm font-medium transition disabled:opacity-50"
          style={
            following
              ? { border: `1px solid ${accent}`, color: accent }
              : { backgroundColor: accent, color: "#fff" }
          }
        >
          {following ? "Following" : "+ Follow"}
        </button>
      )}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10"
          aria-label="More options"
        >
          ⋯
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border border-white/10 bg-black/90 p-1 backdrop-blur-xl">
            <button
              onClick={toggleBlock}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-white/10"
            >
              {blocked ? "Unblock" : "Block user"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
