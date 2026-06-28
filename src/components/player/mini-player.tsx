"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/lib/player-store";

function fmt(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const EQ_BARS = [
  { h: 7, dur: 0.7, delay: 0 },
  { h: 12, dur: 0.9, delay: 0.1 },
  { h: 5, dur: 0.55, delay: 0.05 },
];

export function MiniPlayer() {
  const { queue, index, isPlaying, playToken, toggle, next, prev, setPlaying, stop } = usePlayer();
  const track = queue[index] ?? null;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  // New play request: load the track from the start and play.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (audio.src !== track.url) audio.src = track.url;
    audio.currentTime = 0;
    audio.play().catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playToken]);

  // Play/pause toggles.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (isPlaying) audio.play().catch(() => setPlaying(false));
    else audio.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  if (!track) return null;

  const hasQueue = queue.length > 1;
  const pct = duration ? (progress / duration) * 100 : 0;

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const t = (Number(e.target.value) / 100) * duration;
    audio.currentTime = t;
    setProgress(t);
  }

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-50 px-3 pb-3">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c14]/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {/* Seek bar */}
        <div className="relative h-1.5 w-full bg-white/10">
          <div className="gradient-accent absolute inset-y-0 left-0" style={{ width: `${pct}%` }} />
          <input
            type="range"
            min={0}
            max={100}
            value={pct}
            onChange={seek}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Seek"
          />
        </div>

        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="gradient-accent relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-lg">
            {isPlaying ? (
              <div className="flex items-end gap-0.5" style={{ height: 14 }}>
                {EQ_BARS.map((b, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-white"
                    style={{ height: b.h, transformOrigin: "bottom", animation: `eq-bar ${b.dur}s ease-in-out ${b.delay}s infinite` }}
                  />
                ))}
              </div>
            ) : (
              <span className="text-base">🎵</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{track.title}</p>
            <div className="flex items-baseline gap-2">
              {track.subtitle && <p className="min-w-0 truncate text-xs text-white/40">{track.subtitle}</p>}
              <span className="ml-auto shrink-0 text-[10px] tabular-nums text-white/40">
                {fmt(progress)} / {fmt(duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {hasQueue && (
              <button onClick={prev} className="grid h-8 w-8 place-items-center rounded-full text-white/70 hover:bg-white/10" aria-label="Previous">
                ⏮
              </button>
            )}
            <button
              onClick={toggle}
              className="gradient-accent grid h-9 w-9 place-items-center rounded-full text-white shadow-lg"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "❙❙" : "▶"}
            </button>
            {hasQueue && (
              <button onClick={next} className="grid h-8 w-8 place-items-center rounded-full text-white/70 hover:bg-white/10" aria-label="Next">
                ⏭
              </button>
            )}
          </div>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="hidden h-1 w-16 cursor-pointer accent-(--site-accent) sm:block"
            aria-label="Volume"
            title="Volume"
          />

          <button
            type="button"
            onClick={stop}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Close player"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={next}
        className="hidden"
      />
    </div>
  );
}
