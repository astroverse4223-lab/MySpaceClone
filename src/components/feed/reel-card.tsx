"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/friends/user-avatar";
import { CommentSection } from "./comment-section";
import type { SerializedPost } from "./types";

function expiresLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expiring";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours >= 1) return `${hours}h left`;
  const mins = Math.max(1, Math.floor(ms / (60 * 1000)));
  return `${mins}m left`;
}

export function ReelCard({
  post,
  onUpdate,
}: {
  post: SerializedPost;
  onUpdate: (post: SerializedPost) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showComments, setShowComments] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container || !post.videoUrl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [post.videoUrl]);

  async function react() {
    const res = await fetch(`/api/posts/${post.id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "LIKE" }),
    });
    const json = await res.json();
    if (res.ok) {
      const liked = Boolean(json.reaction);
      onUpdate({
        ...post,
        viewerReaction: liked ? "LIKE" : null,
        totalReactions: post.totalReactions + (liked ? 1 : -1),
      });
    }
  }

  async function toggleRepost() {
    const res = await fetch(`/api/posts/${post.id}/repost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (res.ok) {
      onUpdate({ ...post, viewerReposted: json.reposted, repostCount: post.repostCount + (json.reposted ? 1 : -1) });
    }
  }

  const imageSrc = post.images?.[0] ?? post.gifUrl ?? null;

  return (
    <div ref={containerRef} className="relative flex h-[calc(100vh-72px)] w-full snap-start items-center justify-center bg-black">
      {post.videoUrl && !videoError ? (
        <video
          ref={videoRef}
          src={`${post.videoUrl}#t=0.001`}
          className="h-full w-full object-contain"
          loop
          muted={muted}
          playsInline
          preload="auto"
          onClick={() => setMuted((m) => !m)}
          onError={() => setVideoError(true)}
        />
      ) : post.videoUrl && videoError ? (
        <div className="flex flex-col items-center justify-center gap-2 text-white/50">
          <span className="text-4xl">⚠️</span>
          <p className="text-sm">Video format not supported</p>
          <p className="text-xs text-white/30">Re-encode as H.264 MP4 or WebM</p>
        </div>
      ) : imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt={post.content ?? "Reel"} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/40">Unavailable</div>
      )}

      {post.expiresAt && (
        <span className="absolute top-4 left-4 z-10 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white/90 backdrop-blur">
          ⏳ {expiresLabel(post.expiresAt)}
        </span>
      )}

      <div className="absolute bottom-6 left-4 right-16 text-white">
        <Link href={`/profile/${post.author.username}`} className="flex items-center gap-2">
          <UserAvatar name={post.author.name ?? post.author.username} image={post.author.image} size={32} />
          <span className="text-sm font-medium">{post.author.name ?? post.author.username}</span>
        </Link>
        {post.content && <p className="mt-2 text-sm">{post.content}</p>}
      </div>

      <div className="absolute bottom-6 right-3 flex flex-col items-center gap-4 text-white">
        <button onClick={react} className={`flex flex-col items-center ${post.viewerReaction ? "text-violet-400" : ""}`}>
          <span className="text-2xl">👍</span>
          <span className="text-xs">{post.totalReactions || ""}</span>
        </button>
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center">
          <span className="text-2xl">💬</span>
          <span className="text-xs">{post.commentCount || ""}</span>
        </button>
        <button onClick={toggleRepost} className={`flex flex-col items-center ${post.viewerReposted ? "text-violet-400" : ""}`}>
          <span className="text-2xl">🔁</span>
          <span className="text-xs">{post.repostCount || ""}</span>
        </button>
      </div>

      {showComments && (
        <div
          className="absolute inset-x-0 bottom-0 max-h-[60%] overflow-y-auto rounded-t-2xl bg-[#0a0a0f] p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-white">Comments</h3>
            <button onClick={() => setShowComments(false)} className="text-white/50">
              ×
            </button>
          </div>
          <CommentSection postId={post.id} postAuthorId={post.author.id} />
        </div>
      )}
    </div>
  );
}
