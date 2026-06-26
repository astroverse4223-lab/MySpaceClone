"use client";

import { useEffect, useRef, useState } from "react";

type Sticker = { emoji: string; x: number; y: number };

// Emoji-based trails. The two "cool" non-emoji effects (neon, matrix) are
// handled specially below since they render styled nodes instead of glyphs.
const EFFECT_GLYPHS: Record<string, string[]> = {
  sparkles: ["✨", "⭐", "💫"],
  hearts: ["💖", "💕", "❤️"],
  stars: ["⭐", "🌟", "✦"],
  bubbles: ["🫧", "○", "°"],
  fire: ["🔥", "🧨", "💥"],
  lightning: ["⚡", "🌩️", "✦"],
  skulls: ["💀", "☠️", "🖤"],
  smoke: ["💨", "🌫️", "○"],
  frost: ["❄️", "🧊", "✦"],
  vortex: ["🌀", "💫", "∴"],
};

// Cyberpunk palette cycled through for the neon dot trail.
const NEON_COLORS = ["#22d3ee", "#a855f7", "#f0abfc", "#38bdf8", "#34d399"];
const MATRIX_GLYPHS = "01ｱｲｳｴｵｶｷｸｹｺﾊﾋﾌﾍﾎ日ﾝﾗ7Ξ#".split("");

type Particle = {
  id: number;
  kind: "emoji" | "neon" | "matrix";
  glyph: string;
  x: number;
  y: number;
  color?: string;
};

/**
 * Renders MySpace-style profile flair: a glitter overlay, decorative emoji
 * stickers, and a cursor trail. All purely decorative + pointer-events-none.
 */
// Maps a saved bgEffect id to its overlay class. "glitter" reuses the original.
const BG_FX_CLASS: Record<string, string> = {
  glitter: "profile-glitter",
  starfield: "bg-fx-starfield",
  aurora: "bg-fx-aurora",
  grid: "bg-fx-grid",
  embers: "bg-fx-embers",
  snow: "bg-fx-snow",
  rain: "bg-fx-rain",
  nebula: "bg-fx-nebula",
};

export function ProfileFlair({
  effect,
  glitter,
  bgEffect,
  stickers,
}: {
  effect?: string | null;
  glitter?: boolean;
  bgEffect?: string | null;
  stickers?: Sticker[];
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    if (!effect || effect === "none") return;
    const isNeon = effect === "neon";
    const isMatrix = effect === "matrix";
    const glyphs = EFFECT_GLYPHS[effect];
    if (!isNeon && !isMatrix && !glyphs) return;

    function onMove(e: MouseEvent) {
      const now = Date.now();
      // Neon emits a denser trail; emoji/matrix stay throttled so they don't pile up.
      if (now - lastRef.current < (isNeon ? 16 : 55)) return;
      lastRef.current = now;
      const id = idRef.current++;

      let particle: Particle;
      if (isNeon) {
        particle = {
          id,
          kind: "neon",
          glyph: "",
          x: e.clientX,
          y: e.clientY,
          color: NEON_COLORS[id % NEON_COLORS.length],
        };
      } else if (isMatrix) {
        particle = {
          id,
          kind: "matrix",
          glyph: MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)],
          x: e.clientX,
          y: e.clientY,
        };
      } else {
        particle = {
          id,
          kind: "emoji",
          glyph: glyphs![Math.floor(Math.random() * glyphs!.length)],
          x: e.clientX,
          y: e.clientY,
        };
      }

      setParticles((p) => [...p, particle]);
      const life = isMatrix ? 1100 : 900;
      setTimeout(() => setParticles((p) => p.filter((x) => x.id !== id)), life);
    }

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [effect]);

  return (
    <>
      {/* Keyframes for the cool trails; scoped + cheap, only mounted with flair. */}
      <style>{`
        @keyframes flair-neon { 0% { transform: translate(-50%,-50%) scale(1); opacity: .9; } 100% { transform: translate(-50%,-50%) scale(.2); opacity: 0; } }
        @keyframes flair-matrix { 0% { transform: translate(-50%,-50%); opacity: 1; } 100% { transform: translate(-50%, 36px); opacity: 0; } }
      `}</style>

      {/* Background effect. Falls back to legacy glitter boolean if bgEffect unset. */}
      {(() => {
        const fx = bgEffect && bgEffect !== "none" ? bgEffect : glitter ? "glitter" : null;
        const cls = fx ? BG_FX_CLASS[fx] : null;
        return cls ? <div className={`${cls} pointer-events-none fixed inset-0 z-0`} /> : null;
      })()}

      {stickers?.map((s, i) => (
        <span
          key={i}
          className="pointer-events-none fixed z-0 select-none text-3xl drop-shadow-lg sm:text-4xl"
          style={{ left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%, -50%)" }}
        >
          {s.emoji}
        </span>
      ))}

      {particles.map((p) => {
        if (p.kind === "neon") {
          return (
            <span
              key={p.id}
              className="pointer-events-none fixed z-60 h-3 w-3 rounded-full"
              style={{
                left: p.x,
                top: p.y,
                background: p.color,
                boxShadow: `0 0 8px 2px ${p.color}, 0 0 16px 4px ${p.color}`,
                animation: "flair-neon 0.9s ease-out forwards",
              }}
            />
          );
        }
        if (p.kind === "matrix") {
          return (
            <span
              key={p.id}
              className="pointer-events-none fixed z-60 select-none font-mono text-sm font-bold"
              style={{
                left: p.x,
                top: p.y,
                color: "#22ff66",
                textShadow: "0 0 6px #22ff66",
                animation: "flair-matrix 1.1s linear forwards",
              }}
            >
              {p.glyph}
            </span>
          );
        }
        return (
          <span
            key={p.id}
            className="pointer-events-none fixed z-60 animate-ping select-none text-lg"
            style={{ left: p.x, top: p.y, transform: "translate(-50%, -50%)" }}
          >
            {p.glyph}
          </span>
        );
      })}
    </>
  );
}
