"use client";

import { useState } from "react";
import { Snake } from "@/components/games/snake";
import { Game2048 } from "@/components/games/g2048";
import { Blocks } from "@/components/games/blocks";
import { Breakout } from "@/components/games/breakout";
import { Memory } from "@/components/games/memory";
import { Minesweeper } from "@/components/games/minesweeper";
import { SlidingPuzzle } from "@/components/games/sliding-puzzle";
import { Sudoku } from "@/components/games/sudoku";

type GameDef = {
  key: string;
  name: string;
  emoji: string;
  blurb: string;
  gradient: string;
  Component: React.ComponentType;
};

const GAMES: GameDef[] = [
  { key: "snake", name: "Snake", emoji: "🐍", blurb: "Eat, grow, don't crash", gradient: "from-emerald-500 to-teal-600", Component: Snake },
  { key: "2048", name: "2048", emoji: "🔢", blurb: "Merge tiles to 2048", gradient: "from-amber-500 to-orange-600", Component: Game2048 },
  { key: "blocks", name: "Blocks", emoji: "🧱", blurb: "Stack & clear lines", gradient: "from-cyan-500 to-blue-600", Component: Blocks },
  { key: "breakout", name: "Breakout", emoji: "🧱", blurb: "Smash all the bricks", gradient: "from-pink-500 to-rose-600", Component: Breakout },
  { key: "memory", name: "Memory", emoji: "🃏", blurb: "Match every pair", gradient: "from-violet-500 to-purple-600", Component: Memory },
  { key: "mines", name: "Minesweeper", emoji: "💣", blurb: "Avoid the mines", gradient: "from-slate-500 to-gray-700", Component: Minesweeper },
  { key: "sliding", name: "15 Puzzle", emoji: "🧩", blurb: "Slide tiles in order", gradient: "from-fuchsia-500 to-pink-600", Component: SlidingPuzzle },
  { key: "sudoku", name: "Sudoku", emoji: "9️⃣", blurb: "Classic number logic", gradient: "from-indigo-500 to-violet-600", Component: Sudoku },
];

export default function GamesPage() {
  const [active, setActive] = useState<GameDef | null>(null);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          🎮 <span className="text-gradient-animated">Arcade</span>
        </h1>
        <p className="mt-2 text-sm text-white/50">Free, no sign-in needed. Your best scores save on this device.</p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {GAMES.map((game) => (
          <button
            key={game.key}
            onClick={() => setActive(game)}
            className={`group flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br ${game.gradient} p-5 text-center text-white shadow-lg transition hover:scale-[1.03] hover:shadow-xl`}
          >
            <span className="text-4xl transition group-hover:scale-110">{game.emoji}</span>
            <span className="font-semibold">{game.name}</span>
            <span className="text-xs text-white/80">{game.blurb}</span>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0f] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {active.emoji} {active.name}
              </h2>
              <button
                onClick={() => setActive(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>
            <active.Component />
          </div>
        </div>
      )}
    </div>
  );
}
