"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Bubble = { key: number; left: string; size: number; duration: string; delay: string };
type Meteor = { key: number; top: string; left: string; duration: string; delay: string };
type Confetto = { key: number; left: string; size: number; color: "1" | "2"; duration: string; delay: string };

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

function makeMeteors(): Meteor[] {
  return Array.from({ length: 10 }, (_, i) => ({
    key: i,
    top: `${Math.round(Math.random() * 50)}%`,
    left: `${Math.round(Math.random() * 100)}%`,
    duration: `${4 + Math.round(Math.random() * 5)}s`,
    delay: `-${Math.round(Math.random() * 8)}s`,
  }));
}

function makeConfetti(): Confetto[] {
  return Array.from({ length: 30 }, (_, i) => ({
    key: i,
    left: `${Math.round(Math.random() * 100)}%`,
    size: 6 + Math.round(Math.random() * 8),
    color: Math.random() > 0.5 ? "1" : "2",
    duration: `${6 + Math.round(Math.random() * 8)}s`,
    delay: `-${Math.round(Math.random() * 12)}s`,
  }));
}

export const BG_STORAGE_KEY = "bg-animation";
export const BG_CHANGE_EVENT = "bg-animation-change";

export const BG_ANIMATIONS = [
  { id: "none", name: "None", emoji: "🚫" },
  { id: "orbs", name: "Floating orbs", emoji: "🟣" },
  { id: "aurora", name: "Aurora", emoji: "🌌" },
  { id: "stars", name: "Starfield", emoji: "✨" },
  { id: "bubbles", name: "Bubbles", emoji: "🫧" },
  { id: "meteors", name: "Meteors", emoji: "☄️" },
  { id: "confetti", name: "Confetti", emoji: "🎊" },
  { id: "waves", name: "Waves", emoji: "🌊" },
] as const;

export function AnimatedBackground() {
  const pathname = usePathname();
  const [bg, setBg] = useState("none");
  // Random-but-stable particle sets, built on the client to avoid SSR/CSR mismatch.
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const [confetti, setConfetti] = useState<Confetto[]>([]);

  useEffect(() => {
    try {
      setBg(localStorage.getItem(BG_STORAGE_KEY) ?? "none");
    } catch {
      /* ignore */
    }
    setBubbles(makeBubbles());
    setMeteors(makeMeteors());
    setConfetti(makeConfetti());
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

      {bg === "meteors" &&
        meteors.map((m) => (
          <span
            key={m.key}
            className="bg-meteor"
            style={{
              top: m.top,
              left: m.left,
              animationDuration: m.duration,
              animationDelay: m.delay,
            }}
          />
        ))}

      {bg === "confetti" &&
        confetti.map((c) => (
          <span
            key={c.key}
            className="bg-confetti"
            style={{
              left: c.left,
              width: c.size,
              height: c.size * 0.4,
              background: c.color === "1" ? "var(--site-accent)" : "var(--site-accent-2)",
              animationDuration: c.duration,
              animationDelay: c.delay,
            }}
          />
        ))}

      {bg === "waves" && <div className="bg-waves" />}
    </div>
  );
}
