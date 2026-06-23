"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ReelCard } from "@/components/feed/reel-card";
import { uploadFile } from "@/lib/use-upload";
import type { SerializedPost } from "@/components/feed/types";

type MediaKind = "video" | "image";
type Source = "upload" | "url";

export default function ReelsPage() {
  const { data: session } = useSession();
  const [feedType, setFeedType] = useState<"discover" | "following">("discover");
  const [reels, setReels] = useState<SerializedPost[]>([]);
  const [showComposer, setShowComposer] = useState(false);

  // composer state
  const [kind, setKind] = useState<MediaKind>("video");
  const [source, setSource] = useState<Source>("upload");
  const [mediaUrl, setMediaUrl] = useState("");
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reels?feed=${feedType}`)
      .then((res) => res.json())
      .then((json) => {
        setReels(json.reels ?? []);
        setLoading(false);
      });
  }, [feedType]);

  function handleUpdate(updated: SerializedPost) {
    setReels((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  function resetComposer() {
    setMediaUrl("");
    setContent("");
    setError(undefined);
    setUploading(false);
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(undefined);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setMediaUrl(url);
      // infer kind from the file
      setKind(file.type.startsWith("video/") ? "video" : "image");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function createReel() {
    if (!mediaUrl) {
      setError("Add a video or image first");
      return;
    }
    setError(undefined);
    const body =
      kind === "video"
        ? { type: "VIDEO", videoUrl: mediaUrl, content: content || undefined, isReel: true }
        : { type: "IMAGE", images: [mediaUrl], content: content || undefined, isReel: true };

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (res.ok) {
      setShowComposer(false);
      resetComposer();
      setReels((prev) => [json.post, ...prev]);
    } else {
      setError(json.error ?? "Could not post reel");
    }
  }

  const isPreviewVideo = kind === "video";

  return (
    <div className="relative">
      <div className="absolute top-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        <button
          onClick={() => setFeedType("discover")}
          className={`rounded-full px-4 py-1.5 text-sm backdrop-blur ${feedType === "discover" ? "bg-white text-black" : "bg-black/40 text-white"}`}
        >
          Discover
        </button>
        <button
          onClick={() => setFeedType("following")}
          className={`rounded-full px-4 py-1.5 text-sm backdrop-blur ${feedType === "following" ? "bg-white text-black" : "bg-black/40 text-white"}`}
        >
          Following
        </button>
      </div>

      {session?.user && (
        <button
          onClick={() => setShowComposer(true)}
          className="absolute top-4 right-4 z-10 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30"
        >
          + Reel
        </button>
      )}

      {loading ? (
        <p className="flex h-[calc(100vh-72px)] items-center justify-center text-white/50">Loading reels...</p>
      ) : reels.length === 0 ? (
        <p className="flex h-[calc(100vh-72px)] items-center justify-center text-white/50">
          No reels yet. Be the first to post one.
        </p>
      ) : (
        <div className="h-[calc(100vh-72px)] snap-y snap-mandatory overflow-y-scroll">
          {reels.map((reel) => (
            <ReelCard key={reel.id} post={reel} onUpdate={handleUpdate} />
          ))}
        </div>
      )}

      {showComposer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowComposer(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0f] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white">New reel</h2>

            {/* media kind */}
            <div className="mt-3 flex gap-2">
              {(["video", "image"] as MediaKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setKind(k);
                    setMediaUrl("");
                  }}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-sm capitalize ${
                    kind === k ? "bg-violet-500 text-white" : "border border-white/10 text-white/70 hover:bg-white/5"
                  }`}
                >
                  {k === "video" ? "🎬 Video" : "🖼️ Image"}
                </button>
              ))}
            </div>

            {/* source */}
            <div className="mt-2 flex gap-2">
              {(["upload", "url"] as Source[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSource(s);
                    setMediaUrl("");
                  }}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs capitalize ${
                    source === s ? "bg-white/15 text-white" : "border border-white/10 text-white/60 hover:bg-white/5"
                  }`}
                >
                  {s === "upload" ? "Upload file" : "Paste URL"}
                </button>
              ))}
            </div>

            {source === "upload" ? (
              <div className="mt-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept={kind === "video" ? "video/*" : "image/*"}
                  onChange={onFilePicked}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full rounded-lg border border-dashed border-white/20 px-3 py-6 text-sm text-white/60 hover:border-violet-400/60 hover:text-white disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : mediaUrl ? "✓ Uploaded — choose another" : `Tap to choose a ${kind}`}
                </button>
                <p className="mt-1 text-[11px] text-white/30">
                  Max {kind === "video" ? "50MB" : "8MB"}.
                </p>
              </div>
            ) : (
              <input
                className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/60"
                placeholder={kind === "video" ? "Video URL (.mp4, .webm...)" : "Image URL"}
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            )}

            {mediaUrl && (
              <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-black">
                {isPreviewVideo ? (
                  <video src={mediaUrl} className="max-h-40 w-full object-contain" muted controls />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl} alt="preview" className="max-h-40 w-full object-contain" />
                )}
              </div>
            )}

            <input
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/60"
              placeholder="Caption (optional)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

            <p className="mt-2 text-[11px] text-white/30">⏳ Reels disappear after 24 hours.</p>

            <button
              onClick={createReel}
              disabled={uploading || !mediaUrl}
              className="mt-4 w-full rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400 disabled:opacity-50"
            >
              Post reel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
