"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Bubble = { key: number; left: string; size: number; duration: string; delay: string };

function makeBubbles(): Bubble[] {
  return Array.from({ length: 14 }, (_, i) => {
    const size = 12 + Math.round(Math.random() * 46);
    return {
      key: i,
      left: `${Math.round(Math.random() * 100)}%`,
      size,
      duration: `${10 + Math.round(Math.random() * 16)}s`,
      delay: `-${Math.round(Math.random() * 18)}s`,
    };
  });
}

export const BG_STORAGE_KEY = "bg-animation";
export const BG_CHANGE_EVENT = "bg-animation-change";

export const BG_ANIMATIONS = [
  { id: "none", name: "None", emoji: "🚫" },
  { id: "orbs", name: "Floating orbs", emoji: "🟣" },
  { id: "aurora", name: "Aurora", emoji: "🌌" },
  { id: "stars", name: "Starfield", emoji: "✨" },
  { id: "bubbles", name: "Bubbles", emoji: "🫧" },
] as const;

export function AnimatedBackground() {
  const pathname = usePathname();
  const [bg, setBg] = useState("none");
  // Random-but-stable particle set for the bubbles animation, built on the client.
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    try {
      setBg(localStorage.getItem(BG_STORAGE_KEY) ?? "none");
    } catch {
      /* ignore */
    }
    setBubbles(makeBubbles());
    const onChange = (e: Event) => setBg((e as CustomEvent<string>).detail ?? "none");
    window.addEventListener(BG_CHANGE_EVENT, onChange as EventListener);
    return () => window.removeEventListener(BG_CHANGE_EVENT, onChange as EventListener);
  }, []);

  // Profiles can have their own background photos — never paint over them.
  if (pathname?.startsWith("/profile/")) return null;
  if (bg === "none") return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {bg === "orbs" && (
        <>
          <span
            className="bg-orb"
            style={{ width: 380, height: 380, top: "-6%", left: "-4%", background: "var(--site-accent)" }}
          />
          <span
            className="bg-orb"
            style={{ width: 320, height: 320, top: "28%", right: "-6%", background: "var(--site-accent-2)", animationDelay: "-7s" }}
          />
          <span
            className="bg-orb"
            style={{ width: 300, height: 300, bottom: "-10%", left: "22%", background: "var(--site-accent)", animationDelay: "-13s" }}
          />
        </>
      )}

      {bg === "aurora" && <div className="bg-aurora" />}

      {bg === "stars" && <div className="bg-stars" />}

      {bg === "bubbles" &&
        bubbles.map((b) => (
          <span
            key={b.key}
            className="bg-bubble"
            style={{
              left: b.left,
              width: b.size,
              height: b.size,
              animationDuration: b.duration,
              animationDelay: b.delay,
            }}
          />
        ))}
    </div>
  );
}
