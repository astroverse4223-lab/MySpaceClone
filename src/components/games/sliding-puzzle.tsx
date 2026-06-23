"use client";

import { useEffect, useState } from "react";
import { getHighScore } from "@/lib/game-scores";

const N = 4; // 4x4 (15 puzzle)
const SOLVED = Array.from({ length: N * N }, (_, i) => (i + 1) % (N * N)); // [1..15, 0]

function isSolvable(tiles: number[]): boolean {
  let inv = 0;
  const arr = tiles.filter((t) => t !== 0);
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++) if (arr[i] > arr[j]) inv++;
  const blankRow = Math.floor(tiles.indexOf(0) / N);
  // for 4-wide boards: solvable if (blank on even row from bottom) XOR (inv odd)
  const blankFromBottom = N - blankRow;
  return blankFromBottom % 2 === 0 ? inv % 2 === 1 : inv % 2 === 0;
}

function shuffle(): number[] {
  let tiles: number[];
  do {
    tiles = [...SOLVED].sort(() => Math.random() - 0.5);
  } while (!isSolvable(tiles) || tiles.every((v, i) => v === SOLVED[i]));
  return tiles;
}

export function SlidingPuzzle() {
  const [tiles, setTiles] = useState<number[]>(shuffle);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState(0);
  const solved = tiles.every((v, i) => v === SOLVED[i]);

  useEffect(() => setBest(getHighScore("sliding")), []);

  useEffect(() => {
    if (solved && moves > 0) {
      const prev = getHighScore("sliding");
      if (prev === 0 || moves < prev) {
        window.localStorage.setItem("msr-game-hi:sliding", String(moves));
        setBest(moves);
      }
    }
  }, [solved, moves]);

  function move(i: number) {
    if (solved) return;
    const blank = tiles.indexOf(0);
    const sameRow = Math.floor(i / N) === Math.floor(blank / N);
    const adjacent =
      (sameRow && Math.abs(i - blank) === 1) || (!sameRow && Math.abs(i - blank) === N);
    if (!adjacent) return;
    setTiles((t) => {
      const next = [...t];
      [next[i], next[blank]] = [next[blank], next[i]];
      return next;
    });
    setMoves((m) => m + 1);
  }

  function reset() {
    setTiles(shuffle());
    setMoves(0);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full justify-between text-sm text-white/70">
        <span>Moves: {moves}</span>
        <span>Best: {best || "—"}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 rounded-lg bg-white/5 p-2">
        {tiles.map((v, i) => (
          <button
            key={i}
            onClick={() => move(i)}
            disabled={v === 0}
            className={`flex h-16 w-16 items-center justify-center rounded-md text-xl font-bold transition ${
              v === 0
                ? "cursor-default bg-transparent"
                : "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white hover:brightness-110"
            }`}
          >
            {v || ""}
          </button>
        ))}
      </div>
      {solved && moves > 0 && <p className="text-sm font-semibold text-emerald-300">Solved in {moves} moves! 🎉</p>}
      <button onClick={reset} className="rounded-full border border-white/15 px-4 py-1.5 text-xs hover:bg-white/5">
        Shuffle
      </button>
      <p className="text-xs text-white/40">Click a tile next to the gap to slide it. Order 1–15.</p>
    </div>
  );
}
