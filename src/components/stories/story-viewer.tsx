"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/friends/user-avatar";
import type { StoryGroup } from "./types";

const DURATION_MS = 5000;

export function StoryViewer({
  group,
  onClose,
  onAdvanceGroup,
}: {
  group: StoryGroup;
  onClose: () => void;
  onAdvanceGroup: (direction: 1 | -1) => void;
}) {
  const { data: session } = useSession();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showInsights, setShowInsights] = useState(false);
  const story = group.stories[index];

  useEffect(() => {
    setIndex(0);
  }, [group]);

  useEffect(() => {
    if (!story) return;
    fetch(`/api/stories/${story.id}/view`, { method: "POST" });
  }, [story?.id]);

  useEffect(() => {
    if (!story || showInsights) return; // pause progress while the author reviews insights
    setProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        goNext();
      }
    }, 100);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, showInsights]);

  function goNext() {
    if (index < group.stories.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onAdvanceGroup(1);
    }
  }

  function goPrev() {
    if (index > 0) {
      setIndex((i) => i - 1);
    } else {
      onAdvanceGroup(-1);
    }
  }

  async function vote(optionIndex: number) {
    await fetch(`/api/stories/${story.id}/poll/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionIndex }),
    });
  }

  const voterKey = session?.user ? `voter:${session.user.id}` : "";
  const myVote = story?.pollVotes && voterKey in story.pollVotes ? (story.pollVotes[voterKey] as number) : null;

  const isOwnStory = session?.user?.id === group.author.id;
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sent, setSent] = useState(false);
  const [replyError, setReplyError] = useState<string>();
  const [insights, setInsights] = useState<{
    viewers: { user: { id: string; username: string; name: string | null; image: string | null }; emoji: string | null }[];
    viewCount: number;
    reactionCount: number;
  } | null>(null);

  useEffect(() => {
    setMyReaction(null);
    setReplyText("");
    setSent(false);
    setReplyError(undefined);
    setShowInsights(false);
    setInsights(null);
  }, [story?.id]);

  async function openInsights() {
    setShowInsights(true);
    const res = await fetch(`/api/stories/${story.id}/insights`).catch(() => null);
    if (res && res.ok) setInsights(await res.json());
  }

  async function reactStory(emoji: string) {
    const next = myReaction === emoji ? null : emoji;
    setMyReaction(next);
    setReplyError(undefined);
    const res = await fetch(`/api/stories/${story.id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    }).catch(() => null);
    if (!res || !res.ok) {
      setMyReaction(myReaction); // revert
      const msg = res ? (await res.json().catch(() => ({}))).error : "Couldn't react";
      setReplyError(msg ?? "Couldn't react");
    }
  }

  async function sendReply() {
    if (!replyText.trim() && !myReaction) return;
    setReplyError(undefined);
    const res = await fetch(`/api/stories/${story.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: replyText, emoji: myReaction ?? "" }),
    }).catch(() => null);
    if (res && res.ok) {
      setReplyText("");
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    } else {
      const msg = res ? (await res.json().catch(() => ({}))).error : "Couldn't send";
      setReplyError(msg ?? "Couldn't send reply");
    }
  }

  const STORY_EMOJIS = ["❤️", "😂", "🔥", "😮", "😢", "👏", "🙌"];

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-white/70 hover:text-white">
        ×
      </button>

      <div className="relative h-[80vh] w-full max-w-sm overflow-hidden rounded-2xl bg-black">
        <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
          {group.stories.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-white transition-all"
                style={{ width: i < index ? "100%" : i === index ? `${progress}%` : "0%" }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-5 left-3 z-10 flex items-center gap-2 text-sm text-white">
          <span className="font-medium">{group.author.name ?? group.author.username}</span>
        </div>

        <button onClick={goPrev} className="absolute left-0 top-0 h-full w-1/3" aria-label="Previous" />
        <button onClick={goNext} className="absolute right-0 top-0 h-full w-1/3" aria-label="Next" />

        <div className="flex h-full items-center justify-center p-6 text-center">
          {story.type === "PHOTO" && story.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={story.mediaUrl} alt="" className="max-h-full max-w-full object-contain" />
          )}
          {story.type === "VIDEO" && story.mediaUrl && (
            <video src={story.mediaUrl} autoPlay muted className="max-h-full max-w-full object-contain" />
          )}
          {story.type === "MUSIC" && (
            <div className="text-white">
              <p className="text-4xl">🎵</p>
              {story.content && <p className="mt-3">{story.content}</p>}
            </div>
          )}
          {story.type === "QUESTION" && (
            <div className="text-white">
              <p className="text-lg font-medium">{story.question}</p>
            </div>
          )}
          {story.type === "POLL" && story.pollOptions && (
            <div className="w-full space-y-2 text-white">
              {story.content && <p className="mb-3 font-medium">{story.content}</p>}
              {story.pollOptions.map((option, i) => {
                const counts = story.pollVotes?.counts ?? story.pollOptions!.map(() => 0);
                const total = counts.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round(((counts[i] ?? 0) / total) * 100) : 0;
                return (
                  <button
                    key={option}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (myVote === null) vote(i);
                    }}
                    className="relative w-full overflow-hidden rounded-lg border border-white/20 px-3 py-2 text-left text-sm"
                  >
                    {myVote !== null && (
                      <div className="absolute inset-y-0 left-0 bg-violet-500/40" style={{ width: `${pct}%` }} />
                    )}
                    <span className="relative z-10">{option}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {isOwnStory && (
          <button
            onClick={openInsights}
            className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-3 text-center text-sm text-white/90"
          >
            👁 Seen by {story.viewCount ?? 0} · tap to see who
          </button>
        )}

        {isOwnStory && showInsights && (
          <div
            className="absolute inset-0 z-30 flex flex-col bg-black/85 p-4"
            onClick={(e) => {
              e.stopPropagation();
              setShowInsights(false);
            }}
          >
            <div className="mb-3 flex items-center justify-between text-white" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-medium">
                👁 {insights?.viewCount ?? 0} views · {insights?.reactionCount ?? 0} reactions
              </p>
              <button onClick={() => setShowInsights(false)} className="text-white/60 hover:text-white">
                ×
              </button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {!insights ? (
                <p className="text-sm text-white/50">Loading…</p>
              ) : insights.viewers.length === 0 ? (
                <p className="text-sm text-white/50">No views yet.</p>
              ) : (
                insights.viewers.map((v) => (
                  <div key={v.user.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5">
                    <div className="flex items-center gap-2 text-sm text-white">
                      <UserAvatar name={v.user.name ?? v.user.username} image={v.user.image} size={28} />
                      <span>{v.user.name ?? v.user.username}</span>
                    </div>
                    {v.emoji && <span className="text-lg">{v.emoji}</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {!isOwnStory && session?.user && (
          <div className="absolute inset-x-0 bottom-0 z-20 space-y-2 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="flex justify-center gap-1.5">
              {STORY_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => reactStory(e)}
                  className={`text-2xl transition hover:scale-125 ${myReaction === e ? "scale-125" : "opacity-80"}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
                placeholder={sent ? "Sent! 💬" : `Reply to ${group.author.name ?? group.author.username}...`}
                className="flex-1 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/50"
              />
              <button
                onClick={sendReply}
                className="rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400"
              >
                Send
              </button>
            </div>
            {sent && <p className="text-center text-xs text-emerald-300">Reply sent 💬</p>}
            {replyError && <p className="text-center text-xs text-red-300">{replyError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
