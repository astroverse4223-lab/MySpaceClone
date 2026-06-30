"use client";

import { parseMusicEmbed } from "@/lib/music-embed";
import { useEmbedPlayer } from "@/lib/embed-player-store";

const PROVIDER_LABEL: Record<string, string> = {
  spotify: "Spotify",
  youtube: "YouTube",
  soundcloud: "SoundCloud",
};

export function ProfileSongPlayer({ url, username }: { url: string; username: string }) {
  const embed = parseMusicEmbed(url);
  const { embed: active, play, stop } = useEmbedPlayer();
  // Legacy/invalid links (e.g. a self-hosted file from before embeds were
  // required) no longer play — only Spotify/YouTube/SoundCloud embeds do.
  if (!embed) return null;

  const isThis = active?.embedSrc === embed.embedSrc;

  function onClick() {
    if (isThis) stop();
    else play({ ...embed!, label: `@${username}'s profile song` });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10"
    >
      <span className="gradient-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white">
        {isThis ? "❙❙" : "▶"}
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-white/40">
          {isThis ? "Now playing" : "Profile song"}
        </p>
        <p className="truncate text-sm font-medium text-white/90">
          Play on {PROVIDER_LABEL[embed.provider]}
        </p>
      </div>
    </button>
  );
}
