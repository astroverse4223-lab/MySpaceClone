"use client";

import { usePlayer } from "@/lib/player-store";

export function ProfileSongPlayer({
  url,
  title,
  subtitle,
}: {
  url: string;
  title?: string | null;
  subtitle?: string | null;
}) {
  const { queue, index, isPlaying, playTrack, toggle } = usePlayer();
  const current = queue[index] ?? null;
  const isThis = current?.url === url;
  const playingThis = isThis && isPlaying;

  function onClick() {
    if (isThis) toggle();
    else playTrack({ id: url, url, title: title || "Profile song", subtitle });
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <button
        type="button"
        onClick={onClick}
        className="gradient-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:brightness-110"
        aria-label={playingThis ? "Pause profile song" : "Play profile song"}
      >
        {playingThis ? "❙❙" : "▶"}
      </button>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-white/40">
          {playingThis ? "Now playing" : "Profile song"}
        </p>
        <p className="truncate text-sm font-medium text-white/90">{title || "Profile song"}</p>
      </div>
      {playingThis && (
        <div className="ml-auto flex items-end gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-[var(--site-accent)]"
              style={{ height: 14, animation: `eq 0.8s ease-in-out ${i * 0.15}s infinite` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
