"use client";

import { useEffect, useRef, useState } from "react";
import { BG_ANIMATIONS, BG_STORAGE_KEY, BG_CHANGE_EVENT } from "@/components/animated-background";

type SiteTheme = { id: string; name: string; preview: string };

const SITE_THEMES: SiteTheme[] = [
  { id: "midnight", name: "Midnight", preview: "linear-gradient(135deg,#8b5cf6,#ec4899)" },
  { id: "cyberpunk", name: "Cyberpunk", preview: "linear-gradient(135deg,#f000b8,#00eaff)" },
  { id: "emerald", name: "Emerald", preview: "linear-gradient(135deg,#10b981,#84cc16)" },
  { id: "crimson", name: "Crimson", preview: "linear-gradient(135deg,#f43f5e,#fb923c)" },
  { id: "ocean", name: "Ocean", preview: "linear-gradient(135deg,#38bdf8,#6366f1)" },
  { id: "gold", name: "Gold", preview: "linear-gradient(135deg,#eab308,#f59e0b)" },
  { id: "aurora", name: "Aurora", preview: "linear-gradient(135deg,#22d3ee,#a78bfa,#4ade80)" },
  { id: "mono", name: "Mono", preview: "linear-gradient(135deg,#e5e7eb,#6b7280)" },
];

const STORAGE_KEY = "site-theme";

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("midnight");
  const [retro, setRetro] = useState(false);
  const [bgAnim, setBgAnim] = useState("none");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setActive(saved);
      else setActive(document.documentElement.getAttribute("data-theme") ?? "midnight");
      setRetro(localStorage.getItem("retro-mode") === "on");
      setBgAnim(localStorage.getItem(BG_STORAGE_KEY) ?? "none");
    } catch {
      /* ignore */
    }
  }, []);

  function chooseBg(id: string) {
    setBgAnim(id);
    try {
      localStorage.setItem(BG_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(BG_CHANGE_EVENT, { detail: id }));
  }

  function toggleRetro() {
    const nextOn = !retro;
    setRetro(nextOn);
    try {
      if (nextOn) {
        document.documentElement.setAttribute("data-retro", "on");
        localStorage.setItem("retro-mode", "on");
      } else {
        document.documentElement.removeAttribute("data-retro");
        localStorage.removeItem("retro-mode");
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function choose(id: string) {
    setActive(id);
    document.documentElement.setAttribute("data-theme", id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  const activeTheme = SITE_THEMES.find((t) => t.id === active) ?? SITE_THEMES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change site theme"
        title="Change site theme"
        className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        <span
          className="h-4 w-4 rounded-full ring-1 ring-white/30"
          style={{ background: activeTheme.preview }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c14]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <p className="px-2 py-1.5 text-xs font-semibold text-white/50">Site theme 🎨</p>
          <div className="grid grid-cols-1 gap-0.5">
            {SITE_THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => choose(t.id)}
                className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition hover:bg-white/10 ${
                  active === t.id ? "bg-white/10 text-white" : "text-white/80"
                }`}
              >
                <span className="h-5 w-5 rounded-full ring-1 ring-white/20" style={{ background: t.preview }} />
                {t.name}
                {active === t.id && <span className="ml-auto text-xs text-white/50">✓</span>}
              </button>
            ))}
          </div>

          <div className="mt-1 border-t border-white/10 pt-1">
            <p className="px-2 py-1.5 text-xs font-semibold text-white/50">Background motion ✨</p>
            <div className="grid grid-cols-1 gap-0.5">
              {BG_ANIMATIONS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => chooseBg(b.id)}
                  className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition hover:bg-white/10 ${
                    bgAnim === b.id ? "bg-white/10 text-white" : "text-white/80"
                  }`}
                >
                  <span className="grid h-5 w-5 place-items-center text-base">{b.emoji}</span>
                  {b.name}
                  {bgAnim === b.id && <span className="ml-auto text-xs text-white/50">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-1 border-t border-white/10 pt-1">
            <button
              onClick={toggleRetro}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-white/80 transition hover:bg-white/10"
            >
              <span className="text-base">🪩</span>
              Retro mode
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  retro ? "bg-pink-500 text-white" : "bg-white/10 text-white/50"
                }`}
              >
                {retro ? "ON" : "OFF"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
