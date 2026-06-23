"use client";

import { useCallback, useEffect, useState } from "react";
import { getHighScore, setHighScore } from "@/lib/game-scores";

type Grid = number[][];

const N = 4;

function emptyGrid(): Grid {
  return Array.from({ length: N }, () => Array(N).fill(0));
}

function addRandom(g: Grid): Grid {
  const empties: [number, number][] = [];
  g.forEach((row, r) => row.forEach((v, c) => v === 0 && empties.push([r, c])));
  if (!empties.length) return g;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const next = g.map((row) => [...row]);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function slide(row: number[]): { row: number[]; gained: number } {
  const nums = row.filter((v) => v !== 0);
  let gained = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i] === nums[i + 1]) {
      nums[i] *= 2;
      gained += nums[i];
      nums.splice(i + 1, 1);
    }
  }
  while (nums.length < N) nums.push(0);
  return { row: nums, gained };
}

function rotate(g: Grid): Grid {
  const next = emptyGrid();
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) next[c][N - 1 - r] = g[r][c];
  return next;
}

function equal(a: Grid, b: Grid) {
  return a.every((row, r) => row.every((v, c) => v === b[r][c]));
}

const TILE_COLORS: Record<number, string> = {
  2: "#3b3654",
  4: "#4c4570",
  8: "#7c3aed",
  16: "#8b5cf6",
  32: "#a78bfa",
  64: "#c084fc",
  128: "#e879f9",
  256: "#f472b6",
  512: "#fb7185",
  1024: "#fbbf24",
  2048: "#fde047",
};

export function Game2048() {
  const [grid, setGrid] = useState<Grid>(() => addRandom(addRandom(emptyGrid())));
  const [score, setScore] = useState(0);
  const [high, setHigh] = useState(0);
  const [over, setOver] = useState(false);

  useEffect(() => setHigh(getHighScore("2048")), []);

  const move = useCallback(
    (dir: "left" | "right" | "up" | "down") => {
      setGrid((prev) => {
        let g = prev.map((row) => [...row]);
        // rotate so we always slide left
        const rotations = { left: 0, up: 3, right: 2, down: 1 }[dir];
        for (let i = 0; i < rotations; i++) g = rotate(g);
        let gained = 0;
        g = g.map((row) => {
          const { row: nr, gained: gn } = slide(row);
          gained += gn;
          return nr;
        });
        for (let i = 0; i < (4 - rotations) % 4; i++) g = rotate(g);

        if (equal(g, prev)) return prev;
        const withNew = addRandom(g);
        if (gained) setScore((s) => {
          const ns = s + gained;
          setHigh(setHighScore("2048", ns));
          return ns;
        });
        // game over check
        const full = withNew.every((row) => row.every((v) => v !== 0));
        if (full) {
          let movable = false;
          for (let r = 0; r < N && !movable; r++)
            for (let c = 0; c < N && !movable; c++) {
              if (c < N - 1 && withNew[r][c] === withNew[r][c + 1]) movable = true;
              if (r < N - 1 && withNew[r][c] === withNew[r + 1][c]) movable = true;
            }
          if (!movable) setOver(true);
        }
        return withNew;
      });
    },
    [],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const map: Record<string, "left" | "right" | "up" | "down"> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        move(dir);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  function reset() {
    setGrid(addRandom(addRandom(emptyGrid())));
    setScore(0);
    setOver(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full justify-between text-sm text-white/70">
        <span>Score: {score}</span>
        <span>Best: {high}</span>
      </div>
      <div className="relative rounded-lg bg-white/5 p-2">
        <div className="grid grid-cols-4 gap-2">
          {grid.flat().map((v, i) => (
            <div
              key={i}
              className="flex h-16 w-16 items-center justify-center rounded-md text-lg font-bold text-white"
              style={{ background: v ? TILE_COLORS[v] ?? "#fde047" : "rgba(255,255,255,0.05)" }}
            >
              {v || ""}
            </div>
          ))}
        </div>
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/70">
            <p className="text-lg font-semibold text-white">Game over · {score}</p>
            <button onClick={reset} className="rounded-full bg-violet-500 px-5 py-2 text-sm font-medium hover:bg-violet-400">
              Play again
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={reset} className="rounded-full border border-white/15 px-4 py-1.5 text-xs hover:bg-white/5">
          New game
        </button>
      </div>
      <p className="text-xs text-white/40">Arrow keys to combine tiles. Reach 2048!</p>
    </div>
  );
}
