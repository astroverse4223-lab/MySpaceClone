"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/use-upload";
import { THEMES, THEME_IDS, FONTS, FONT_IDS, getFontStack } from "@/lib/themes";

interface ProfileForm {
  displayName: string;
  headline: string;
  bio: string;
  location: string;
  mood: string;
  moodEmoji: string;
  theme: string;
  accentColor: string;
  fontFamily: string;
  themeColor: string;
  interests: string;
  links: { label: string; url: string }[];
  favoriteArtists: string;
  avatarImage: string;
  coverImage: string;
  backgroundImage: string;
  profileSongUrl: string;
  profileSongTitle: string;
  cursorEffect: string;
  glitter: boolean;
  stickers: { emoji: string; x: number; y: number }[];
}

const EMPTY_FORM: ProfileForm = {
  displayName: "",
  headline: "",
  bio: "",
  location: "",
  mood: "",
  moodEmoji: "",
  theme: "midnight",
  accentColor: "#7c3aed",
  fontFamily: "sans",
  themeColor: "#7c3aed",
  interests: "",
  links: [],
  favoriteArtists: "",
  avatarImage: "",
  coverImage: "",
  backgroundImage: "",
  profileSongUrl: "",
  profileSongTitle: "",
  cursorEffect: "none",
  glitter: false,
  stickers: [],
};

const MOOD_PRESETS = ["😀", "😎", "🥰", "😴", "🤔", "😭", "🔥", "🎉", "💀", "🌈", "☕", "🎵"];
const CURSOR_EFFECTS = [
  { id: "none", label: "None" },
  { id: "sparkles", label: "✨ Sparkles" },
  { id: "hearts", label: "💖 Hearts" },
  { id: "stars", label: "⭐ Stars" },
  { id: "bubbles", label: "🫧 Bubbles" },
];
const STICKER_CHOICES = ["⭐", "💖", "🔥", "🌈", "🦋", "🌸", "💀", "👽", "🎀", "✨", "🍄", "🛸", "😎", "🎵", "💜"];

export default function EditProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const songInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session?.user?.username) return;
    fetch(`/api/profile/me`)
      .then((res) => res.json())
      .then((json) => {
        if (json.profile) {
          setForm({
            displayName: json.profile.displayName ?? "",
            headline: json.profile.headline ?? "",
            bio: json.profile.bio ?? "",
            location: json.profile.location ?? "",
            mood: json.profile.mood ?? "",
            moodEmoji: json.profile.moodEmoji ?? "",
            theme: json.profile.theme ?? "midnight",
            accentColor: json.profile.accentColor ?? "#7c3aed",
            fontFamily: json.profile.fontFamily ?? "sans",
            themeColor: json.profile.themeColor ?? "#7c3aed",
            interests: (json.profile.interests ?? []).join(", "),
            links: json.profile.links ?? [],
            favoriteArtists: (json.profile.favoriteArtists ?? []).join(", "),
            avatarImage: json.profile.avatarImage ?? "",
            coverImage: json.profile.coverImage ?? "",
            backgroundImage: json.profile.backgroundImage ?? "",
            profileSongUrl: json.profile.profileSongUrl ?? "",
            profileSongTitle: json.profile.profileSongTitle ?? "",
            cursorEffect: json.profile.cursorEffect ?? "none",
            glitter: json.profile.glitter ?? false,
            stickers: Array.isArray(json.profile.stickers) ? json.profile.stickers : [],
          });
        }
        setLoading(false);
      });
  }, [session?.user?.username]);

  async function handleImageUpload(field: "avatarImage" | "coverImage" | "backgroundImage", file: File) {
    setError(undefined);
    setUploadingField(field);
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, [field]: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSongUpload(file: File) {
    setError(undefined);
    setUploadingField("profileSongUrl");
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, profileSongUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingField(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(undefined);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.displayName || undefined,
        headline: form.headline || undefined,
        bio: form.bio || undefined,
        location: form.location || undefined,
        mood: form.mood || undefined,
        moodEmoji: form.moodEmoji || undefined,
        theme: form.theme,
        accentColor: form.accentColor,
        fontFamily: form.fontFamily,
        themeColor: form.themeColor,
        interests: form.interests
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        links: form.links.filter((l) => l.label && l.url),
        favoriteArtists: form.favoriteArtists
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        avatarImage: form.avatarImage,
        coverImage: form.coverImage,
        backgroundImage: form.backgroundImage,
        profileSongUrl: form.profileSongUrl,
        profileSongTitle: form.profileSongTitle || undefined,
        cursorEffect: form.cursorEffect,
        glitter: form.glitter,
        stickers: form.stickers,
      }),
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
      return;
    }

    setSuccess(true);
    if (session?.user?.username) {
      setTimeout(() => router.push(`/profile/${session.user.username}`), 800);
    }
  }

  function addLink() {
    setForm((f) => ({ ...f, links: [...f.links, { label: "", url: "" }] }));
  }

  function updateLink(index: number, field: "label" | "url", value: string) {
    setForm((f) => ({
      ...f,
      links: f.links.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    }));
  }

  function removeLink(index: number) {
    setForm((f) => ({ ...f, links: f.links.filter((_, i) => i !== index) }));
  }

  if (loading) {
    return <p className="px-6 py-16 text-center text-white/60">Loading...</p>;
  }

  const input = "w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-violet-400/60";
  const uploadButton = "rounded-lg border border-white/15 px-3 py-2 text-xs font-medium hover:bg-white/5 disabled:opacity-50";

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Edit your profile</h1>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            Saved! Redirecting to your profile...
          </p>
        )}

        <div>
          <label className="mb-1 block text-sm text-white/60">Cover photo</label>
          <div
            className="h-28 w-full rounded-xl bg-cover bg-center"
            style={{
              backgroundImage: form.coverImage ? `url(${form.coverImage})` : undefined,
              background: form.coverImage ? undefined : `linear-gradient(135deg, ${form.themeColor}, #0a0a0f)`,
            }}
          />
          <input
            ref={coverInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageUpload("coverImage", e.target.files[0])}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className={uploadButton}
              disabled={uploadingField === "coverImage"}
              onClick={() => coverInputRef.current?.click()}
            >
              {uploadingField === "coverImage" ? "Uploading..." : "Upload cover photo"}
            </button>
            {form.coverImage && (
              <button
                type="button"
                className={uploadButton}
                onClick={() => setForm((f) => ({ ...f, coverImage: "" }))}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/60">Profile picture</label>
          <div className="flex items-center gap-4">
            <div
              className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 text-2xl font-semibold"
              style={{
                backgroundImage: form.avatarImage ? `url(${form.avatarImage})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {!form.avatarImage && (form.displayName || session?.user?.username || "?")[0]?.toUpperCase()}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageUpload("avatarImage", e.target.files[0])}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className={uploadButton}
                disabled={uploadingField === "avatarImage"}
                onClick={() => avatarInputRef.current?.click()}
              >
                {uploadingField === "avatarImage" ? "Uploading..." : "Upload picture"}
              </button>
              {form.avatarImage && (
                <button
                  type="button"
                  className={uploadButton}
                  onClick={() => setForm((f) => ({ ...f, avatarImage: "" }))}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/60">Profile background</label>
          <p className="mb-2 text-xs text-white/40">Shown behind your whole profile page, like the old MySpace backgrounds.</p>
          <div
            className="h-20 w-full rounded-xl border border-white/10 bg-cover bg-center"
            style={{ backgroundImage: form.backgroundImage ? `url(${form.backgroundImage})` : undefined }}
          />
          <input
            ref={backgroundInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageUpload("backgroundImage", e.target.files[0])}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className={uploadButton}
              disabled={uploadingField === "backgroundImage"}
              onClick={() => backgroundInputRef.current?.click()}
            >
              {uploadingField === "backgroundImage" ? "Uploading..." : "Upload background"}
            </button>
            {form.backgroundImage && (
              <button
                type="button"
                className={uploadButton}
                onClick={() => setForm((f) => ({ ...f, backgroundImage: "" }))}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/60">Profile song</label>
          <p className="mb-2 text-xs text-white/40">Upload an mp3, or paste a direct audio link. Plays on your profile page.</p>
          <input
            className={input}
            placeholder="Song title (e.g. Crank That - Soulja Boy)"
            value={form.profileSongTitle}
            onChange={(e) => setForm((f) => ({ ...f, profileSongTitle: e.target.value }))}
          />
          <input
            className={`${input} mt-2`}
            placeholder="https://... (direct mp3 link)"
            value={form.profileSongUrl}
            onChange={(e) => setForm((f) => ({ ...f, profileSongUrl: e.target.value }))}
          />
          <input
            ref={songInputRef}
            type="file"
            accept="audio/mpeg,audio/ogg,audio/wav"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleSongUpload(e.target.files[0])}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className={uploadButton}
              disabled={uploadingField === "profileSongUrl"}
              onClick={() => songInputRef.current?.click()}
            >
              {uploadingField === "profileSongUrl" ? "Uploading..." : "Upload mp3"}
            </button>
            {form.profileSongUrl && (
              <button
                type="button"
                className={uploadButton}
                onClick={() => setForm((f) => ({ ...f, profileSongUrl: "" }))}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/60">Display name</label>
          <input
            className={input}
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/60">Headline</label>
          <p className="mb-2 text-xs text-white/40">A short tagline shown right under your name.</p>
          <input
            className={input}
            placeholder="✨ living my best life ✨"
            maxLength={100}
            value={form.headline}
            onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/60">Current mood</label>
          <p className="mb-2 text-xs text-white/40">Classic MySpace mood — pick an emoji and a word.</p>
          <div className="flex gap-2">
            <div className="flex flex-wrap gap-1">
              {MOOD_PRESETS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, moodEmoji: emoji }))}
                  className={`h-9 w-9 rounded-lg border text-lg transition ${
                    form.moodEmoji === emoji
                      ? "border-violet-400 bg-violet-500/20"
                      : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <input
            className={`${input} mt-2`}
            placeholder="feeling… (e.g. nostalgic)"
            maxLength={40}
            value={form.mood}
            onChange={(e) => setForm((f) => ({ ...f, mood: e.target.value }))}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/60">Bio</label>
          <textarea
            className={input}
            rows={4}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/60">Location</label>
          <input
            className={input}
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/3 p-4">
          <label className="mb-1 block text-sm font-medium text-white/80">🎨 Page theme</label>
          <p className="mb-3 text-xs text-white/40">
            Make your page yours. Themes show behind everything (unless you upload a background image).
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {THEME_IDS.map((id) => {
              const t = THEMES[id];
              const active = form.theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, theme: id, accentColor: f.accentColor || t.accent }))}
                  className={`overflow-hidden rounded-xl border text-left transition ${
                    active ? "border-white ring-2 ring-white/40" : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="h-12 w-full" style={{ background: t.pageBackground }} />
                  <div className="px-2 py-1.5 text-xs">
                    {t.emoji} {t.name}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-white/60">Accent color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-16 rounded-lg border border-white/10 bg-black/30"
                  value={form.accentColor}
                  onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value, themeColor: e.target.value }))}
                />
                <span className="text-xs text-white/40">Buttons, links & highlights</span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/60">Font</label>
              <select
                className={input}
                value={form.fontFamily}
                onChange={(e) => setForm((f) => ({ ...f, fontFamily: e.target.value }))}
                style={{ fontFamily: getFontStack(form.fontFamily) }}
              >
                {FONT_IDS.map((id) => (
                  <option key={id} value={id} style={{ fontFamily: FONTS[id].stack }}>
                    {FONTS[id].name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Flair */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <label className="mb-2 block text-sm font-medium text-white/80">✨ Profile flair</label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-white/60">Cursor trail</label>
              <select
                className={input}
                value={form.cursorEffect}
                onChange={(e) => setForm((f) => ({ ...f, cursorEffect: e.target.value }))}
              >
                {CURSOR_EFFECTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={form.glitter}
                  onChange={(e) => setForm((f) => ({ ...f, glitter: e.target.checked }))}
                  className="h-4 w-4 accent-violet-500"
                />
                ✨ Glitter background
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs text-white/60">
              Stickers <span className="text-white/30">(tap to add — placed randomly on your page)</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {STICKER_CHOICES.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() =>
                    setForm((f) =>
                      f.stickers.length >= 20
                        ? f
                        : {
                            ...f,
                            stickers: [
                              ...f.stickers,
                              {
                                emoji,
                                x: Math.round(Math.random() * 88 + 6),
                                y: Math.round(Math.random() * 78 + 12),
                              },
                            ],
                          },
                    )
                  }
                  className="rounded-lg bg-white/5 px-2 py-1 text-lg transition hover:bg-white/15"
                >
                  {emoji}
                </button>
              ))}
            </div>
            {form.stickers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {form.stickers.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, stickers: f.stickers.filter((_, idx) => idx !== i) }))}
                    className="rounded-full bg-violet-500/20 px-2 py-0.5 text-sm hover:bg-red-500/30"
                    title="Remove"
                  >
                    {s.emoji} ✕
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/60">Interests (comma separated)</label>
          <input
            className={input}
            value={form.interests}
            onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/60">Favorite artists (comma separated)</label>
          <input
            className={input}
            value={form.favoriteArtists}
            onChange={(e) => setForm((f) => ({ ...f, favoriteArtists: e.target.value }))}
          />
          <a href="/playlists" className="mt-1 inline-block text-xs text-violet-400 hover:underline">
            Manage your playlists →
          </a>
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/60">Links</label>
          <div className="space-y-2">
            {form.links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={input}
                  placeholder="Label"
                  value={link.label}
                  onChange={(e) => updateLink(i, "label", e.target.value)}
                />
                <input
                  className={input}
                  placeholder="https://..."
                  value={link.url}
                  onChange={(e) => updateLink(i, "url", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  className="rounded-lg border border-white/10 px-3 text-sm text-white/60 hover:bg-white/5"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addLink}
            className="mt-2 text-sm text-violet-400 hover:underline"
          >
            + Add link
          </button>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium hover:bg-violet-400 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}
