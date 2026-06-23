"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/friends/user-avatar";
import { uploadFile } from "@/lib/use-upload";
import { StoryViewer } from "./story-viewer";
import type { StoryGroup } from "./types";

type StoryKind = "PHOTO" | "VIDEO" | "QUESTION";

export function StoriesBar() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [type, setType] = useState<StoryKind>("PHOTO");
  const [source, setSource] = useState<"upload" | "url">("upload");
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/stories");
    const json = await res.json();
    setGroups(json.groups ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(undefined);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setMediaUrl(url);
      setType(file.type.startsWith("video/") ? "VIDEO" : "PHOTO");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function resetComposer() {
    setContent("");
    setMediaUrl("");
    setQuestion("");
    setError(undefined);
  }

  async function createStory() {
    setError(undefined);
    const body =
      type === "QUESTION"
        ? { type: "QUESTION", question }
        : { type, mediaUrl, content: content || undefined };

    if (type !== "QUESTION" && !mediaUrl) {
      setError("Add a photo or video first");
      return;
    }

    const res = await fetch("/api/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowComposer(false);
      resetComposer();
      load();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Could not share story");
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {session?.user && (
        <button onClick={() => setShowComposer(true)} className="flex flex-col items-center gap-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-white/30 text-xl text-white/50">
            +
          </div>
          <span className="text-xs text-white/50">Add story</span>
        </button>
      )}

      {groups.map((group, i) => (
        <button key={group.author.id} onClick={() => setActiveIndex(i)} className="flex flex-col items-center gap-1">
          <div className={`rounded-full p-0.5 ${group.hasUnseen ? "bg-gradient-to-tr from-violet-500 to-pink-500" : "bg-white/10"}`}>
            <div className="rounded-full bg-[#0a0a0f] p-0.5">
              <UserAvatar name={group.author.name ?? group.author.username} image={group.author.image} size={52} />
            </div>
          </div>
          <span className="max-w-[56px] truncate text-xs text-white/60">
            {group.author.name ?? group.author.username}
          </span>
        </button>
      ))}

      {activeIndex !== null && groups[activeIndex] && (
        <StoryViewer
          group={groups[activeIndex]}
          onClose={() => {
            setActiveIndex(null);
            load();
          }}
          onAdvanceGroup={(direction) => {
            const next = activeIndex + direction;
            if (next >= 0 && next < groups.length) {
              setActiveIndex(next);
            } else {
              setActiveIndex(null);
              load();
            }
          }}
        />
      )}

      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowComposer(false)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0f] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-medium">Add a story</h2>
            <div className="mt-3 flex gap-2">
              {(["PHOTO", "VIDEO", "QUESTION"] as StoryKind[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setType(t);
                    setMediaUrl("");
                  }}
                  className={`rounded-full px-3 py-1 text-xs capitalize ${type === t ? "bg-violet-500" : "border border-white/15"}`}
                >
                  {t === "PHOTO" ? "📷 Photo" : t === "VIDEO" ? "🎬 Video" : "❓ Question"}
                </button>
              ))}
            </div>

            {type === "QUESTION" ? (
              <input
                className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
                placeholder="Ask a question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            ) : (
              <>
                <div className="mt-3 flex gap-2">
                  {(["upload", "url"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSource(s);
                        setMediaUrl("");
                      }}
                      className={`flex-1 rounded-lg px-3 py-1.5 text-xs capitalize ${
                        source === s ? "bg-white/15" : "border border-white/10 text-white/60"
                      }`}
                    >
                      {s === "upload" ? "Upload file" : "Paste URL"}
                    </button>
                  ))}
                </div>

                {source === "upload" ? (
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      accept={type === "VIDEO" ? "video/*" : "image/*"}
                      onChange={onFile}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="mt-2 w-full rounded-lg border border-dashed border-white/20 px-3 py-5 text-sm text-white/60 hover:border-violet-400/60 hover:text-white disabled:opacity-50"
                    >
                      {uploading ? "Uploading..." : mediaUrl ? "✓ Uploaded — choose another" : `Tap to choose a ${type === "VIDEO" ? "video" : "photo"}`}
                    </button>
                  </>
                ) : (
                  <input
                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
                    placeholder={type === "VIDEO" ? "Video URL" : "Image URL"}
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                  />
                )}

                {mediaUrl && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-black">
                    {type === "VIDEO" ? (
                      <video src={mediaUrl} className="max-h-40 w-full object-contain" muted controls />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl} alt="preview" className="max-h-40 w-full object-contain" />
                    )}
                  </div>
                )}

                <input
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
                  placeholder="Caption (optional)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </>
            )}

            {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

            <button
              onClick={createStory}
              disabled={uploading}
              className="mt-4 w-full rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium hover:bg-violet-400 disabled:opacity-50"
            >
              Share story
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
