"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PostCard } from "@/components/feed/post-card";
import type { SerializedPost } from "@/components/feed/types";

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<SerializedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts?tag=${encodeURIComponent(tag)}&limit=50`)
      .then((res) => res.json())
      .then((json) => {
        setPosts(json.posts ?? []);
        setLoading(false);
      });
  }, [tag]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold">
        <span className="text-gradient-animated">#{tag}</span>
      </h1>
      <p className="mt-1 text-sm text-white/40">
        {loading ? "Loading..." : `${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
      </p>

      <div className="mt-6 space-y-4">
        {!loading && posts.length === 0 && (
          <p className="text-sm text-white/40">No posts with this tag yet. Be the first — post with #{tag}!</p>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onUpdate={(updated) => setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
            onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}
