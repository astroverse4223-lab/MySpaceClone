"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { timeAgo } from "@/lib/time";
import { UserAvatar } from "@/components/friends/user-avatar";
import { CommentSection } from "./comment-section";
import { RichText } from "@/components/rich-text";
import { TiltCard } from "@/components/ui/tilt-card";
import type { SerializedPost } from "./types";

const REACTIONS: { type: string; emoji: string }[] = [
  { type: "LIKE", emoji: "👍" },
  { type: "LOVE", emoji: "❤️" },
  { type: "LAUGH", emoji: "😂" },
  { type: "FIRE", emoji: "🔥" },
  { type: "WOW", emoji: "😮" },
  { type: "SAD", emoji: "😢" },
  { type: "ANGRY", emoji: "😡" },
  { type: "CARE", emoji: "🥰" },
  { type: "CLAP", emoji: "👏" },
];

export function PostCard({
  post,
  onUpdate,
  onDelete,
}: {
  post: SerializedPost;
  onUpdate: (post: SerializedPost) => void;
  onDelete: (id: string) => void;
}) {
  const { data: session } = useSession();
  const [showComments, setShowComments] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function react(type: string) {
    setPickerOpen(false);
    const res = await fetch(`/api/posts/${post.id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const json = await res.json();
    if (!res.ok) return;

    const wasSameType = post.viewerReaction === type;
    const counts = { ...post.reactionCounts };
    if (post.viewerReaction) counts[post.viewerReaction] = Math.max(0, (counts[post.viewerReaction] ?? 1) - 1);
    if (!wasSameType) counts[type] = (counts[type] ?? 0) + 1;

    onUpdate({
      ...post,
      viewerReaction: json.reaction ? type : null,
      reactionCounts: counts,
      totalReactions: Object.values(counts).reduce((a, b) => a + b, 0),
    });
  }

  async function toggleBookmark() {
    const res = await fetch(`/api/posts/${post.id}/bookmark`, { method: "POST" });
    const json = await res.json();
    if (res.ok) onUpdate({ ...post, viewerBookmarked: json.bookmarked });
  }

  async function toggleRepost() {
    const res = await fetch(`/api/posts/${post.id}/repost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (res.ok) {
      onUpdate({
        ...post,
        viewerReposted: json.reposted,
        repostCount: post.repostCount + (json.reposted ? 1 : -1),
      });
    }
  }

  async function vote(optionIndex: number) {
    const res = await fetch(`/api/posts/${post.id}/poll/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionIndex }),
    });
    const json = await res.json();
    if (res.ok) onUpdate({ ...post, pollVotes: json.pollVotes });
  }

  async function remove() {
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) onDelete(post.id);
  }

  async function report() {
    const reason = window.prompt("Why are you reporting this post?");
    if (!reason) return;
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "POST", targetId: post.id, reason }),
    });
    window.alert("Thanks — our team will review this.");
  }

  const isOwner = session?.user?.id === post.author.id;
  const voterKey = session?.user ? `voter:${session.user.id}` : "";
  const myVote = post.pollVotes && voterKey in post.pollVotes ? (post.pollVotes[voterKey] as number) : null;
  const voteCounts = post.pollVotes?.counts ?? post.pollOptions?.map(() => 0) ?? [];
  const totalVotes = voteCounts.reduce((a, b) => a + b, 0);

  return (
    <TiltCard>
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3">
          <UserAvatar name={post.author.name ?? post.author.username} image={post.author.image} />
          <div>
            <p className="text-sm font-medium">{post.author.name ?? post.author.username}</p>
            <p className="text-xs text-white/40">{timeAgo(post.createdAt)}</p>
          </div>
        </Link>
        {isOwner ? (
          <button onClick={remove} className="text-xs text-white/30 hover:text-red-300">
            Delete
          </button>
        ) : (
          <button onClick={report} className="text-xs text-white/30 hover:text-yellow-300">
            Report
          </button>
        )}
      </div>

      {post.isLocked ? (
        <div className="mt-3 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 text-center">
          <p className="text-sm text-white/80">🔒 Subscriber-only content</p>
          <Link
            href={`/profile/${post.author.username}`}
            className="mt-2 inline-block rounded-full bg-violet-500 px-4 py-1.5 text-xs font-medium hover:bg-violet-400"
          >
            Become a member
          </Link>
        </div>
      ) : (
        <>
          {post.content && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-white/90">
              <RichText text={post.content} />
            </p>
          )}
        </>
      )}

      {post.images.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.images[0]} alt="" className="max-h-96 w-full object-cover" />
        </div>
      )}

      {post.gifUrl && (
        <div className="relative mt-3 overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.gifUrl} alt="" className="max-h-96 w-full object-cover" />
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
            GIF
          </span>
        </div>
      )}

      {post.type === "POLL" && post.pollOptions && (
        <div className="mt-3 space-y-2">
          {post.pollOptions.map((option, i) => {
            const count = voteCounts[i] ?? 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            return (
              <button
                key={option}
                onClick={() => myVote === null && vote(i)}
                disabled={myVote !== null}
                className="relative w-full overflow-hidden rounded-lg border border-white/10 px-3 py-2 text-left text-sm disabled:cursor-default"
              >
                {myVote !== null && (
                  <div
                    className="absolute inset-y-0 left-0 bg-violet-500/30"
                    style={{ width: `${pct}%` }}
                  />
                )}
                <span className="relative z-10 flex justify-between">
                  <span>
                    {option} {myVote === i && "✓"}
                  </span>
                  {myVote !== null && <span>{pct}%</span>}
                </span>
              </button>
            );
          })}
          <p className="text-xs text-white/30">{totalVotes} vote{totalVotes === 1 ? "" : "s"}</p>
        </div>
      )}

      <div className="relative mt-4 flex items-center gap-4 text-sm text-white/60">
        <div className="relative">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className={`flex items-center gap-1 ${post.viewerReaction ? "text-violet-400" : ""}`}
          >
            {post.viewerReaction ? REACTIONS.find((r) => r.type === post.viewerReaction)?.emoji : "👍"}
            <span>{post.totalReactions || ""}</span>
          </button>
          {pickerOpen && (
            <div className="absolute bottom-full left-0 mb-1 flex gap-1 rounded-full border border-white/10 bg-black/80 p-1">
              {REACTIONS.map((r) => (
                <button key={r.type} onClick={() => react(r.type)} className="px-1.5 text-lg hover:scale-125">
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowComments((v) => !v)} className="flex items-center gap-1">
          💬 <span>{post.commentCount || ""}</span>
        </button>

        <button onClick={toggleRepost} className={`flex items-center gap-1 ${post.viewerReposted ? "text-violet-400" : ""}`}>
          🔁 <span>{post.repostCount || ""}</span>
        </button>

        <button onClick={toggleBookmark} className={`ml-auto ${post.viewerBookmarked ? "text-violet-400" : ""}`}>
          {post.viewerBookmarked ? "🔖" : "📑"}
        </button>
      </div>

      {showComments && <CommentSection postId={post.id} postAuthorId={post.author.id} />}
    </article>
    </TiltCard>
  );
}
