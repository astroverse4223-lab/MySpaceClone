"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CommunitySummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  themeColor: string;
  bannerImage: string | null;
  iconImage: string | null;
  _count: { members: number };
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetch("/api/communities")
      .then((res) => res.json())
      .then((json) => {
        setCommunities(json.communities ?? []);
        setLoading(false);
      });
  }, []);

  async function create() {
    setError(undefined);
    const res = await fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error);
      return;
    }
    window.location.href = `/communities/${json.community.slug}`;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Communities</h1>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-medium text-white/60">Start a community</h2>
        <input
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
          placeholder="What's it about?"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        <button
          onClick={create}
          className="mt-2 rounded-full bg-violet-500 px-4 py-1.5 text-sm font-medium hover:bg-violet-400"
        >
          Create
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="text-sm text-white/40">Loading...</p>
        ) : communities.length === 0 ? (
          <p className="text-sm text-white/40">No communities yet. Be the first to start one.</p>
        ) : (
          communities.map((c) => (
            <Link
              key={c.id}
              href={`/communities/${c.slug}`}
              className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-white/20 hover:bg-white/10"
            >
              <div
                className="h-20 bg-cover bg-center"
                style={{
                  backgroundImage: c.bannerImage
                    ? `url(${c.bannerImage})`
                    : `linear-gradient(135deg, ${c.themeColor}, #0a0a0f)`,
                }}
              />
              <div className="flex items-center gap-3 px-4 py-3">
                <div
                  className="-mt-8 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-[#0a0a0f] bg-cover bg-center text-lg font-bold shadow-lg"
                  style={{
                    backgroundImage: c.iconImage ? `url(${c.iconImage})` : undefined,
                    backgroundColor: c.iconImage ? undefined : c.themeColor,
                  }}
                >
                  {!c.iconImage && c.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  {c.description && <p className="truncate text-xs text-white/50">{c.description}</p>}
                  <p className="text-xs text-white/40">{c._count.members} members</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
