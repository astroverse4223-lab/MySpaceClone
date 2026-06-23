"use client";

import { useState } from "react";
import { PostCard } from "@/components/feed/post-card";
import type { SerializedPost } from "@/components/feed/types";

export function ProfilePosts({ initialPosts }: { initialPosts: SerializedPost[] }) {
  const [posts, setPosts] = useState<SerializedPost[]>(initialPosts);

  function handleUpdate(updated: SerializedPost) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  if (posts.length === 0) {
    return <p className="text-sm opacity-50">No posts yet.</p>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onUpdate={handleUpdate} onDelete={handleDelete} />
      ))}
    </div>
  );
}
