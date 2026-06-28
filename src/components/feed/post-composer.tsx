"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { uploadFile } from "@/lib/use-upload";
import { UserAvatar } from "@/components/friends/user-avatar";
import { GifPicker } from "@/components/feed/gif-picker";
import { TEXT_STYLES, applyTextStyle } from "@/lib/text-styles";
import type { SerializedPost } from "./types";

interface OwnTier {
  id: string;
  name: string;
}

const EMOJI_PICK = [
  "😀", "😂", "🥹", "😍", "😎", "🥳", "😢", "😡", "🤔", "😴",
  "👍", "👏", "🙌", "🙏", "💪", "✌️", "🤝", "👀", "💅", "🤷",
  "❤️", "🔥", "✨", "🎉", "💯", "😭", "🥰", "😜", "🤩", "😬",
  "🌟", "🌈", "☀️", "🌙", "⚡", "🍕", "🎵", "📸", "🚀", "💜",
];

export function PostComposer({
  onPosted,
  communityId,
}: {
  onPosted: (post: SerializedPost) => void;
  communityId?: string;
}) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<
    { id: string; username: string; name: string | null; image: string | null }[]
  >([]);
  const [hashtagQuery, setHashtagQuery] = useState<string | null>(null);
  const [hashtagResults, setHashtagResults] = useState<{ tag: string; count: number }[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showStyles, setShowStyles] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [ownTiers, setOwnTiers] = useState<OwnTier[]>([]);
  const [requiredTierId, setRequiredTierId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (communityId || !session?.user?.username) return;
    fetch(`/api/creator/tiers?username=${session.user.username}`)
      .then((res) => res.json())
      .then((json) => setOwnTiers(json.tiers ?? []));
  }, [communityId, session?.user?.username]);

  useEffect(() => {
    if (mentionQuery === null || mentionQuery.length < 2) {
      setMentionResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(mentionQuery)}`)
        .then((res) => res.json())
        .then((json) => setMentionResults(json.users ?? []))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [mentionQuery]);

  useEffect(() => {
    if (hashtagQuery === null || hashtagQuery.length < 1) {
      setHashtagResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/hashtags/search?q=${encodeURIComponent(hashtagQuery)}`)
        .then((res) => res.json())
        .then((json) => setHashtagResults(json.tags ?? []))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [hashtagQuery]);

  // Close toolbar popovers (emoji / font style) on outside click.
  useEffect(() => {
    if (!showEmoji && !showStyles) return;
    function onClick(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
        setShowStyles(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showEmoji, showStyles]);

  function onContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    const caret = e.target.selectionStart ?? val.length;
    const before = val.slice(0, caret);
    const mentionMatch = before.match(/(?:^|\s)@(\w{1,30})$/);
    const hashtagMatch = before.match(/(?:^|\s)#(\w{1,50})$/);
    setMentionQuery(mentionMatch ? mentionMatch[1] : null);
    setHashtagQuery(!mentionMatch && hashtagMatch ? hashtagMatch[1].toLowerCase() : null);
  }

  function insertMention(username: string) {
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? content.length;
    const before = content.slice(0, caret).replace(/@(\w{1,30})$/, `@${username} `);
    setContent(before + content.slice(caret));
    setMentionQuery(null);
    setMentionResults([]);
    requestAnimationFrame(() => el?.focus());
  }

  function insertHashtag(tag: string) {
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? content.length;
    const before = content.slice(0, caret).replace(/#(\w{1,50})$/, `#${tag} `);
    setContent(before + content.slice(caret));
    setHashtagQuery(null);
    setHashtagResults([]);
    requestAnimationFrame(() => el?.focus());
  }

  function insertAtCaret(text: string) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? content.length;
    const end = el?.selectionEnd ?? content.length;
    const next = content.slice(0, start) + text + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + text.length, start + text.length);
    });
  }

  function applyStyle(styleId: string) {
    setContent((c) => applyTextStyle(c, styleId));
    setShowStyles(false);
  }

  async function handleFileSelect(file: File) {
    setError(undefined);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setImageUrl(url);
      setGifUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function attachGif(url: string) {
    setGifUrl(url);
    setImageUrl("");
    setShowGifPicker(false);
  }

  async function submit() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(undefined);
    setSubmitting(true);

    const body = showPoll
      ? {
          type: "POLL",
          content: content || undefined,
          pollOptions: pollOptions.map((o) => o.trim()).filter(Boolean),
          communityId,
          requiredTierId: requiredTierId || undefined,
        }
      : gifUrl
        ? {
            type: "GIF",
            content: content || undefined,
            gifUrl,
            communityId,
            requiredTierId: requiredTierId || undefined,
          }
        : {
            type: imageUrl ? "IMAGE" : "TEXT",
            content: content || undefined,
            images: imageUrl ? [imageUrl] : undefined,
            communityId,
            requiredTierId: requiredTierId || undefined,
          };

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSubmitting(false);
    submittingRef.current = false;

    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
      return;
    }

    onPosted(json.post);
    setContent("");
    setImageUrl("");
    setGifUrl("");
    setShowPoll(false);
    setPollOptions(["", ""]);
    setRequiredTierId("");
  }

  const suggestMentions = mentionQuery !== null && mentionResults.length > 0;
  const suggestHashtags = !suggestMentions && hashtagQuery !== null && hashtagResults.length > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex gap-3">
        <UserAvatar name={session?.user?.name ?? session?.user?.username ?? "?"} image={session?.user?.image} size={40} />
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            className="w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-white/30"
            rows={3}
            placeholder="What's on your mind? Use @ to mention and # for tags"
            value={content}
            onChange={onContentChange}
          />
          {(suggestMentions || suggestHashtags) && (
            <div className="absolute left-0 top-full z-60 mt-1 w-56 overflow-hidden rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl">
              {suggestMentions &&
                mentionResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => insertMention(u.username)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/10"
                  >
                    <span className="font-medium text-accent">@{u.username}</span>
                    {u.name && <span className="truncate text-xs text-white/40">{u.name}</span>}
                  </button>
                ))}
              {suggestHashtags &&
                hashtagResults.map((h) => (
                  <button
                    key={h.tag}
                    type="button"
                    onClick={() => insertHashtag(h.tag)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-white/10"
                  >
                    <span className="font-medium text-accent">#{h.tag}</span>
                    <span className="text-xs text-white/30">{h.count}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {!showPoll && imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="mt-3 max-h-64 w-full rounded-xl object-cover" />
      )}
      {!showPoll && gifUrl && (
        <div className="relative mt-3 overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gifUrl} alt="" className="max-h-64 w-full object-cover" />
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
            GIF
          </span>
        </div>
      )}
      {(imageUrl || gifUrl) && !showPoll && (
        <button
          type="button"
          onClick={() => {
            setImageUrl("");
            setGifUrl("");
          }}
          className="mt-2 text-xs text-white/40 hover:text-white/70"
        >
          Remove media
        </button>
      )}

      {showPoll && (
        <div className="mt-3 space-y-2">
          {pollOptions.map((opt, i) => (
            <input
              key={i}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={(e) =>
                setPollOptions((options) => options.map((o, idx) => (idx === i ? e.target.value : o)))
              }
            />
          ))}
          {pollOptions.length < 6 && (
            <button
              type="button"
              onClick={() => setPollOptions((options) => [...options, ""])}
              className="text-xs text-violet-400 hover:underline"
            >
              + Add option
            </button>
          )}
        </div>
      )}

      {ownTiers.length > 0 && (
        <select
          value={requiredTierId}
          onChange={(e) => setRequiredTierId(e.target.value)}
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs outline-none focus:border-violet-400/60"
        >
          <option value="">Public post</option>
          {ownTiers.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {tier.name} members only
            </option>
          ))}
        </select>
      )}

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
        <div ref={toolbarRef} className="relative flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <button
            type="button"
            title="Add photo"
            onClick={() => !showPoll && fileInputRef.current?.click()}
            disabled={uploading || showPoll}
            className="grid h-9 w-9 place-items-center rounded-full text-lg text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            {uploading ? "…" : "📷"}
          </button>

          <button
            type="button"
            title="Add GIF"
            onClick={() => {
              if (showPoll) return;
              setShowGifPicker((v) => !v);
              setShowEmoji(false);
              setShowStyles(false);
            }}
            disabled={showPoll}
            className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30 ${
              showGifPicker ? "bg-white/10 text-white" : ""
            }`}
          >
            GIF
          </button>
          {showGifPicker && <GifPicker onSelect={attachGif} onClose={() => setShowGifPicker(false)} />}

          <button
            type="button"
            title="Emoji"
            onClick={() => {
              setShowEmoji((v) => !v);
              setShowStyles(false);
              setShowGifPicker(false);
            }}
            className={`grid h-9 w-9 place-items-center rounded-full text-lg text-white/60 transition hover:bg-white/10 hover:text-white ${
              showEmoji ? "bg-white/10 text-white" : ""
            }`}
          >
            😊
          </button>

          <button
            type="button"
            title="Font style"
            onClick={() => {
              setShowStyles((v) => !v);
              setShowEmoji(false);
              setShowGifPicker(false);
            }}
            className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white ${
              showStyles ? "bg-white/10 text-white" : ""
            }`}
          >
            Aa
          </button>

          <button
            type="button"
            onClick={() => setShowPoll((v) => !v)}
            className={`ml-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              showPoll ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            {showPoll ? "✕ Poll" : "📊 Poll"}
          </button>

          {showEmoji && (
            <div className="absolute bottom-full left-0 z-60 mb-2 grid w-64 grid-cols-8 gap-1 rounded-xl border border-white/10 bg-black/90 p-2 backdrop-blur-xl">
              {EMOJI_PICK.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => insertAtCaret(e)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-base transition hover:scale-125 hover:bg-white/10"
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {showStyles && (
            <div className="absolute bottom-full left-0 z-60 mb-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl">
              {TEXT_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => applyStyle(s.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  {s.label}
                  <span className="text-white/50">{s.sample}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {content.length > 0 && (
            <span className={`text-[11px] tabular-nums ${content.length > 4800 ? "text-red-400" : "text-white/30"}`}>
              {content.length}/5000
            </span>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="gradient-accent rounded-full px-5 py-1.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
