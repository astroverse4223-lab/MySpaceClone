"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { timeAgo } from "@/lib/time";
import { UserAvatar } from "@/components/friends/user-avatar";
import { RichText } from "@/components/rich-text";
import type { SerializedComment } from "./types";

const COMMENT_EMOJIS = ["❤️", "😂", "🔥", "👍", "😮", "😢", "👏"];

export function CommentSection({ postId, postAuthorId }: { postId: string; postAuthorId?: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<SerializedComment[]>([]);
  const [resolvedPostAuthorId, setResolvedPostAuthorId] = useState<string | undefined>(postAuthorId);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const viewerId = session?.user?.id;
  const viewerRole = session?.user?.role;
  const isAdmin = viewerRole === "ADMIN" || viewerRole === "MODERATOR";

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((res) => res.json())
      .then((json) => {
        setComments(json.comments ?? []);
        if (json.postAuthorId) setResolvedPostAuthorId(json.postAuthorId);
        setLoading(false);
      });
  }, [postId]);

  function canDelete(comment: SerializedComment) {
    if (!viewerId) return false;
    return comment.author.id === viewerId || resolvedPostAuthorId === viewerId || isAdmin;
  }

  async function submit() {
    if (!content.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setComments((c) => [...c, { ...json.comment, likeCount: 0, viewerLiked: false }]);
      setContent("");
    }
  }

  async function remove(id: string) {
    const prev = comments;
    setComments((cs) => cs.filter((c) => c.id !== id));
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res || !res.ok) setComments(prev); // restore on failure
  }

  async function reactComment(id: string, emoji: string) {
    setPickerFor(null);
    const res = await fetch(`/api/comments/${id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    }).catch(() => null);
    if (!res || !res.ok) return;
    const json = await res.json();
    setComments((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              viewerReaction: json.viewerReaction,
              viewerLiked: json.viewerReaction !== null,
              reactionCounts: json.counts,
              likeCount: json.total,
            }
          : c,
      ),
    );
  }

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      {loading ? (
        <p className="text-xs text-white/40">Loading comments...</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((comment) => (
            <li key={comment.id} className="group flex items-start gap-2">
              <UserAvatar name={comment.author.name ?? comment.author.username} image={comment.author.image} size={28} />
              <div className="flex-1">
                <div className="inline-block rounded-xl bg-white/5 px-3 py-2 text-sm">
                  <Link href={`/profile/${comment.author.username}`} className="font-medium hover:underline">
                    {comment.author.name ?? comment.author.username}
                  </Link>{" "}
                  <span className="whitespace-pre-wrap text-white/80">
                    <RichText text={comment.content} />
                  </span>
                </div>
                {comment.reactionCounts && Object.keys(comment.reactionCounts).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 pl-1">
                    {Object.entries(comment.reactionCounts).map(([emoji, count]) => (
                      <span
                        key={emoji}
                        className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                          comment.viewerReaction === emoji ? "bg-violet-500/30" : "bg-white/5"
                        }`}
                      >
                        {emoji} {count}
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative mt-1 flex items-center gap-3 pl-1">
                  <span className="text-[10px] text-white/30">{timeAgo(comment.createdAt)}</span>
                  <button
                    onClick={() => setPickerFor(pickerFor === comment.id ? null : comment.id)}
                    className={`flex items-center gap-1 text-[11px] transition ${
                      comment.viewerReaction ? "text-pink-400" : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {comment.viewerReaction ?? "😀"} React
                  </button>
                  {pickerFor === comment.id && (
                    <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-full border border-white/10 bg-black/90 p-1">
                      {COMMENT_EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => reactComment(comment.id, e)}
                          className="px-1 text-base transition hover:scale-125"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                  {canDelete(comment) && (
                    <button
                      onClick={() => remove(comment.id)}
                      className="text-[11px] text-white/30 transition hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Delete comment"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-sm outline-none focus:border-violet-400/60"
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-full bg-violet-500 px-4 py-1.5 text-xs font-medium hover:bg-violet-400 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
