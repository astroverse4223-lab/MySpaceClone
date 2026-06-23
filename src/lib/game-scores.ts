"use client";

// Tiny localStorage-backed high score store. Client-only, no backend (keeps it free).
const PREFIX = "msr-game-hi:";

export function getHighScore(game: string): number {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(PREFIX + game) ?? 0);
}

export function setHighScore(game: string, score: number): number {
  if (typeof window === "undefined") return score;
  const current = getHighScore(game);
  if (score > current) {
    window.localStorage.setItem(PREFIX + game, String(score));
    return score;
  }
  return current;
}
