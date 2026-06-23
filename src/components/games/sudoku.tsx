"use client";

import { useEffect, useMemo, useState } from "react";

type Board = number[]; // 81 cells, 0 = empty

function canPlace(b: Board, idx: number, val: number): boolean {
  const row = Math.floor(idx / 9);
  const col = idx % 9;
  for (let i = 0; i < 9; i++) {
    if (b[row * 9 + i] === val) return false;
    if (b[i * 9 + col] === val) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) if (b[(br + r) * 9 + (bc + c)] === val) return false;
  return true;
}

function fill(b: Board): boolean {
  const idx = b.indexOf(0);
  if (idx === -1) return true;
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
  for (const n of nums) {
    if (canPlace(b, idx, n)) {
      b[idx] = n;
      if (fill(b)) return true;
      b[idx] = 0;
    }
  }
  return false;
}

function generate(holes: number): { puzzle: Board; solution: Board } {
  const solution: Board = Array(81).fill(0);
  fill(solution);
  const puzzle = [...solution];
  let removed = 0;
  while (removed < holes) {
    const i = Math.floor(Math.random() * 81);
    if (puzzle[i] !== 0) {
      puzzle[i] = 0;
      removed++;
    }
  }
  return { puzzle, solution };
}

export function Sudoku() {
  const [{ puzzle, solution }, setGame] = useState(() => generate(40));
  const [cells, setCells] = useState<Board>(puzzle);
  const [selected, setSelected] = useState<number | null>(null);
  const givens = useMemo(() => puzzle.map((v) => v !== 0), [puzzle]);

  useEffect(() => setCells(puzzle), [puzzle]);

  const solved = cells.every((v, i) => v === solution[i]);

  function setValue(val: number) {
    if (selected === null || givens[selected]) return;
    setCells((c) => c.map((v, i) => (i === selected ? val : v)));
  }

  function newGame() {
    const g = generate(40);
    setGame(g);
    setSelected(null);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-sm text-white/70">{solved ? "🎉 Solved!" : "Fill the grid 1–9"}</div>
      <div className="grid grid-cols-9 overflow-hidden rounded-lg border-2 border-white/30">
        {cells.map((v, i) => {
          const row = Math.floor(i / 9);
          const col = i % 9;
          const wrong = v !== 0 && v !== solution[i];
          const isSel = selected === i;
          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex h-9 w-9 items-center justify-center text-sm transition ${
                isSel ? "bg-violet-500/40" : givens[i] ? "bg-white/10" : "bg-white/[0.03] hover:bg-white/10"
              }`}
              style={{
                borderRight: col % 3 === 2 && col !== 8 ? "2px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
                borderBottom: row % 3 === 2 && row !== 8 ? "2px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
                color: givens[i] ? "#fff" : wrong ? "#f87171" : "#a78bfa",
                fontWeight: givens[i] ? 700 : 500,
              }}
            >
              {v || ""}
            </button>
          );
        })}
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => setValue(n)}
            className="h-9 w-9 rounded-md bg-white/10 text-sm font-medium hover:bg-violet-500/40"
          >
            {n}
          </button>
        ))}
        <button onClick={() => setValue(0)} className="h-9 rounded-md bg-white/10 px-3 text-sm hover:bg-white/20">
          ⌫
        </button>
      </div>
      <button onClick={newGame} className="rounded-full border border-white/15 px-4 py-1.5 text-xs hover:bg-white/5">
        New puzzle
      </button>
      <p className="text-xs text-white/40">Tap a cell, then a number. Wrong entries show red.</p>
    </div>
  );
}
