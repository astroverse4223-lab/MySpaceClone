"use client";

import { useEffect, useRef, useState } from "react";

interface Gif {
  id: string;
  title: string;
  preview: string;
  url: string;
}

export function GifPicker({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(true);
  const [unconfigured, setUnconfigured] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(
      () => {
        fetch(`/api/giphy/search?q=${encodeURIComponent(q)}`)
          .then(async (res) => {
            if (res.status === 503) {
              setUnconfigured(true);
              setGifs([]);
              return;
            }
            const json = await res.json();
            setGifs(json.gifs ?? []);
          })
          .catch(() => setGifs([]))
          .finally(() => setLoading(false));
      },
      q ? 300 : 0,
    );
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 z-20 mb-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-black/90 shadow-2xl shadow-black/50 backdrop-blur-xl"
    >
      {unconfigured ? (
        <div className="p-3">
          <p className="text-xs text-white/50">GIF search isn&apos;t set up yet — paste a link instead.</p>
          <div className="mt-2 flex gap-2">
            <input
              autoFocus
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && manualUrl.trim() && onSelect(manualUrl.trim())}
              placeholder="https://media.giphy.com/…"
              className="flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs outline-none focus:border-violet-400/60"
            />
            <button
              type="button"
              onClick={() => manualUrl.trim() && onSelect(manualUrl.trim())}
              className="gradient-accent rounded-lg px-2.5 py-1.5 text-xs font-medium text-white"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="border-b border-white/10 p-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Giphy…"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs outline-none focus:border-violet-400/60"
            />
          </div>
          <div className="grid max-h-64 grid-cols-3 gap-1 overflow-y-auto p-2">
            {loading ? (
              <p className="col-span-3 py-6 text-center text-xs text-white/40">Loading…</p>
            ) : gifs.length === 0 ? (
              <p className="col-span-3 py-6 text-center text-xs text-white/40">No GIFs found.</p>
            ) : (
              gifs.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onSelect(g.url)}
                  className="overflow-hidden rounded-lg transition hover:ring-2 hover:ring-violet-400"
                  title={g.title}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.preview} alt={g.title} className="h-20 w-full object-cover" />
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
