"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { uploadFile } from "@/lib/use-upload";
import type { SerializedPost } from "./types";

interface OwnTier {
  id: string;
  name: string;
}

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
  const [imageUrl, setImageUrl] = useState("");
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [ownTiers, setOwnTiers] = useState<OwnTier[]>([]);
  const [requiredTierId, setRequiredTierId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

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

  function onContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    const caret = e.target.selectionStart ?? val.length;
    const match = val.slice(0, caret).match(/(?:^|\s)@(\w{1,30})$/);
    setMentionQuery(match ? match[1] : null);
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

  async function handleFileSelect(file: File) {
    setError(undefined);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
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
    setShowPoll(false);
    setPollOptions(["", ""]);
    setRequiredTierId("");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="relative">
        <textarea
          ref={textareaRef}
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-white/30"
          rows={3}
          placeholder="What's on your mind? Use @ to mention and # for tags"
          value={content}
          onChange={onContentChange}
        />
        {mentionResults.length > 0 && (
          <div className="absolute left-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl">
            {mentionResults.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => insertMention(u.username)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/10"
              >
                <span className="font-medium">@{u.username}</span>
                {u.name && <span className="truncate text-xs text-white/40">{u.name}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {!showPoll && (
        <div className="mt-2">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="mb-2 max-h-64 w-full rounded-lg object-cover" />
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : imageUrl ? "Change image" : "+ Add photo"}
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5"
              >
                Remove
              </button>
            )}
          </div>
        </div>
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

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowPoll((v) => !v)}
          className="text-xs text-white/50 hover:text-white"
        >
          {showPoll ? "Remove poll" : "+ Poll"}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="rounded-full bg-violet-500 px-5 py-1.5 text-sm font-medium hover:bg-violet-400 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
