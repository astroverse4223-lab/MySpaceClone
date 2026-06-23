"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PostComposer } from "@/components/feed/post-composer";
import { PostCard } from "@/components/feed/post-card";
import { StoriesBar } from "@/components/stories/stories-bar";
import type { SerializedPost } from "@/components/feed/types";

export function FeedStream() {
  const [posts, setPosts] = useState<SerializedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const url = cursor ? `/api/posts?cursor=${cursor}` : "/api/posts";
    const res = await fetch(url);
    const json = await res.json();
    setPosts((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      const incoming = (json.posts as SerializedPost[]).filter((p) => !seen.has(p.id));
      return [...prev, ...incoming];
    });
    setCursor(json.nextCursor);
    setHasMore(Boolean(json.nextCursor));
    setLoading(false);
    setInitialLoading(false);
  }, [cursor, hasMore, loading]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  function handlePosted(post: SerializedPost) {
    setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]));
  }

  function handleUpdate(updated: SerializedPost) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <StoriesBar />

      <div className="mt-6">
        <PostComposer onPosted={handlePosted} />
      </div>

      <div className="mt-6 space-y-4">
        {initialLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass animate-pulse rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/10" />
                  <div className="space-y-2">
                    <div className="h-3 w-32 rounded bg-white/10" />
                    <div className="h-2 w-20 rounded bg-white/10" />
                  </div>
                </div>
                <div className="mt-4 h-3 w-full rounded bg-white/10" />
                <div className="mt-2 h-3 w-2/3 rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <p className="text-3xl">🌱</p>
            <p className="mt-3 text-sm text-white/60">No posts yet. Be the first to share something.</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="animate-fade-up">
              <PostCard post={post} onUpdate={handleUpdate} onDelete={handleDelete} />
            </div>
          ))
        )}
      </div>

      <div ref={sentinelRef} className="h-4" />
      {loading && !initialLoading && <p className="text-center text-xs text-white/30">Loading more…</p>}
      {!hasMore && posts.length > 0 && (
        <p className="py-4 text-center text-xs text-white/30">You&apos;re all caught up. ✨</p>
      )}
    </div>
  );
}
