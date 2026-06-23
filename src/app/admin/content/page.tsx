"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AdminPost {
  id: string;
  type: string;
  isReel: boolean;
  content: string | null;
  images: string[];
  videoUrl: string | null;
  createdAt: string;
  author: { username: string; name: string | null };
  commentCount: number;
  reactionCount: number;
}

export default function AdminContentPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/posts?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    setPosts(json.posts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    setPosts((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Content moderation</h1>
      <p className="mt-1 text-sm text-white/40">Recent posts &amp; reels. Remove anything that breaks the rules.</p>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
          placeholder="Search post text..."
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
        ) : posts.length === 0 ? (
          <p className="text-sm text-white/40">No posts found.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs text-white/40">
                  <Link href={`/profile/${post.author.username}`} className="hover:underline">
                    @{post.author.username}
                  </Link>{" "}
                  · {post.isReel ? "🎬 Reel" : post.type} · {post.commentCount} 💬 · {post.reactionCount} ❤️
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-white/85">
                  {post.content || (post.videoUrl ? "[video]" : post.images.length ? "[image]" : "[no text]")}
                </p>
              </div>
              <button
                onClick={() => remove(post.id)}
                className="shrink-0 rounded-lg border border-red-500/40 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
