"use client";

import { useEffect, useRef, useState } from "react";

type Sticker = { emoji: string; x: number; y: number };

const EFFECT_GLYPHS: Record<string, string[]> = {
  sparkles: ["✨", "⭐", "💫"],
  hearts: ["💖", "💕", "❤️"],
  stars: ["⭐", "🌟", "✦"],
  bubbles: ["🫧", "○", "°"],
};

type Particle = { id: number; glyph: string; x: number; y: number };

/**
 * Renders MySpace-style profile flair: a glitter overlay, decorative emoji
 * stickers, and a cursor trail. All purely decorative + pointer-events-none.
 */
export function ProfileFlair({
  effect,
  glitter,
  stickers,
}: {
  effect?: string | null;
  glitter?: boolean;
  stickers?: Sticker[];
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    const glyphs = effect ? EFFECT_GLYPHS[effect] : undefined;
    if (!glyphs) return;

    function onMove(e: MouseEvent) {
      const now = Date.now();
      if (now - lastRef.current < 60) return; // throttle
      lastRef.current = now;
      const id = idRef.current++;
      const glyph = glyphs![Math.floor(Math.random() * glyphs!.length)];
      setParticles((p) => [...p, { id, glyph, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setParticles((p) => p.filter((x) => x.id !== id)), 900);
    }

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [effect]);

  return (
    <>
      {glitter && <div className="profile-glitter pointer-events-none fixed inset-0 z-0" />}

      {stickers?.map((s, i) => (
        <span
          key={i}
          className="pointer-events-none fixed z-0 select-none text-3xl drop-shadow-lg sm:text-4xl"
          style={{ left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%, -50%)" }}
        >
          {s.emoji}
        </span>
      ))}

      {particles.map((p) => (
        <span
          key={p.id}
          className="pointer-events-none fixed z-[60] animate-ping select-none text-lg"
          style={{ left: p.x, top: p.y, transform: "translate(-50%, -50%)" }}
        >
          {p.glyph}
        </span>
      ))}
    </>
  );
}
