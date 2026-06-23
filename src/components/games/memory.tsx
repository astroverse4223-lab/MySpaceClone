"use client";

import { useEffect, useState } from "react";
import { getHighScore } from "@/lib/game-scores";

const EMOJIS = ["🎮", "🚀", "🌟", "🎵", "🔥", "🍕", "🐱", "🌈"];

type Card = { id: number; emoji: string; flipped: boolean; matched: boolean };

function shuffle(): Card[] {
  return [...EMOJIS, ...EMOJIS]
    .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5)
    .map((c, i) => ({ ...c, id: i }));
}

export function Memory() {
  const [cards, setCards] = useState<Card[]>(shuffle);
  const [picks, setPicks] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState(0);
  const [won, setWon] = useState(false);

  useEffect(() => setBest(getHighScore("memory")), []);

  useEffect(() => {
    if (picks.length === 2) {
      const [a, b] = picks;
      setMoves((m) => m + 1);
      if (cards[a].emoji === cards[b].emoji) {
        setCards((cs) => cs.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
        setPicks([]);
      } else {
        const t = setTimeout(() => {
          setCards((cs) => cs.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c)));
          setPicks([]);
        }, 700);
        return () => clearTimeout(t);
      }
    }
  }, [picks, cards]);

  useEffect(() => {
    if (cards.length && cards.every((c) => c.matched) && !won) {
      setWon(true);
      // lower moves is better — store as "best" where higher is better via inverse; just keep fewest moves
      const prev = getHighScore("memory");
      if (prev === 0 || moves < prev) {
        window.localStorage.setItem("msr-game-hi:memory", String(moves));
        setBest(moves);
      } else {
        setBest(prev);
      }
    }
  }, [cards, won, moves]);

  function flip(i: number) {
    if (picks.length === 2 || cards[i].flipped || cards[i].matched) return;
    setCards((cs) => cs.map((c, idx) => (idx === i ? { ...c, flipped: true } : c)));
    setPicks((p) => [...p, i]);
  }

  function reset() {
    setCards(shuffle());
    setPicks([]);
    setMoves(0);
    setWon(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full justify-between text-sm text-white/70">
        <span>Moves: {moves}</span>
        <span>Best: {best || "—"}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => flip(i)}
            className={`flex h-16 w-16 items-center justify-center rounded-lg text-2xl transition ${
              card.flipped || card.matched
                ? "bg-violet-500/20 ring-1 ring-violet-400/40"
                : "bg-white/10 hover:bg-white/15"
            } ${card.matched ? "opacity-60" : ""}`}
          >
            {card.flipped || card.matched ? card.emoji : ""}
          </button>
        ))}
      </div>
      {won && <p className="text-sm font-semibold text-emerald-300">Solved in {moves} moves! 🎉</p>}
      <button onClick={reset} className="rounded-full border border-white/15 px-4 py-1.5 text-xs hover:bg-white/5">
        New game
      </button>
      <p className="text-xs text-white/40">Match all the pairs. Fewer moves is better.</p>
    </div>
  );
}
