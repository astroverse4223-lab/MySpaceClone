"use client";

import { useEffect, useState } from "react";

interface CommunityRow {
  slug: string;
  name: string;
  visibility: string;
  createdBy: { username: string };
  _count: { members: number; posts: number };
}

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<CommunityRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/communities");
    const json = await res.json();
    setCommunities(json.communities ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(slug: string) {
    if (!confirm(`Delete community "${slug}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/communities/${slug}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Communities</h1>
      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="text-sm text-white/40">Loading...</p>
        ) : (
          communities.map((c) => (
            <div key={c.slug} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-white/40">
                  by {c.createdBy.username} · {c._count.members} members · {c._count.posts} posts ·{" "}
                  {c.visibility}
                </p>
              </div>
              <button onClick={() => remove(c.slug)} className="text-xs text-white/40 hover:text-red-300">
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
