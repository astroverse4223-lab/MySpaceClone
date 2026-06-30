"use client";

import { useEmbedPlayer } from "@/lib/embed-player-store";
import { usePlayer } from "@/lib/player-store";

export function GlobalSongPlayer() {
  const { embed, expanded, stop, toggleExpanded } = useEmbedPlayer();
  const playerActive = usePlayer((s) => s.queue.length > 0);

  if (!embed) return null;

  const bottomOffset = playerActive ? "bottom-24" : "bottom-0";

  return (
    <div className={`safe-bottom fixed inset-x-0 z-40 px-3 pb-3 ${bottomOffset}`}>
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c14]/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <span className="text-base">🎵</span>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">{embed.label}</p>
          <button
            type="button"
            onClick={toggleExpanded}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
            aria-label={expanded ? "Collapse" : "Expand"}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "▾" : "▴"}
          </button>
          <button
            type="button"
            onClick={stop}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Stop"
            title="Stop"
          >
            ✕
          </button>
        </div>

        {/* Always mounted once loaded so playback survives collapsing — only visibility toggles. */}
        <div style={{ display: expanded ? "block" : "none" }}>
          <iframe
            src={embed.embedSrc}
            width="100%"
            height={embed.height}
            style={{ border: 0, display: "block" }}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            title={embed.label}
          />
        </div>
      </div>
    </div>
  );
}
