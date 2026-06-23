"use client";

import { useState } from "react";

const SIZE = 9;
const MINES = 10;

type Cell = { mine: boolean; revealed: boolean; flagged: boolean; count: number };

function build(): Cell[][] {
  const grid: Cell[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ mine: false, revealed: false, flagged: false, count: 0 })),
  );
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    if (!grid[r][c].mine) {
      grid[r][c].mine = true;
      placed++;
    }
  }
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c].mine) continue;
      let n = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && grid[nr][nc].mine) n++;
        }
      grid[r][c].count = n;
    }
  return grid;
}

const NUM_COLORS = ["", "#60a5fa", "#4ade80", "#f87171", "#c084fc", "#fb923c", "#22d3ee", "#fde047", "#f472b6"];

export function Minesweeper() {
  const [grid, setGrid] = useState<Cell[][]>(build);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");

  function reveal(r: number, c: number) {
    if (status !== "playing") return;
    setGrid((prev) => {
      const g = prev.map((row) => row.map((cell) => ({ ...cell })));
      const cell = g[r][c];
      if (cell.revealed || cell.flagged) return prev;
      if (cell.mine) {
        g.forEach((row) => row.forEach((x) => x.mine && (x.revealed = true)));
        setStatus("lost");
        return g;
      }
      // flood fill
      const stack: [number, number][] = [[r, c]];
      while (stack.length) {
        const [cr, cc] = stack.pop()!;
        const cur = g[cr][cc];
        if (cur.revealed || cur.flagged || cur.mine) continue;
        cur.revealed = true;
        if (cur.count === 0) {
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
              const nr = cr + dr;
              const nc = cc + dc;
              if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && !g[nr][nc].revealed) stack.push([nr, nc]);
            }
        }
      }
      const safe = g.flat().filter((x) => !x.mine);
      if (safe.every((x) => x.revealed)) setStatus("won");
      return g;
    });
  }

  function flag(e: React.MouseEvent, r: number, c: number) {
    e.preventDefault();
    if (status !== "playing") return;
    setGrid((prev) =>
      prev.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === c && !cell.revealed ? { ...cell, flagged: !cell.flagged } : cell)),
      ),
    );
  }

  function reset() {
    setGrid(build());
    setStatus("playing");
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-sm text-white/70">
        {status === "playing" ? "💣 Find all safe cells" : status === "won" ? "🎉 You cleared it!" : "💥 Boom! Game over"}
      </div>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => reveal(r, c)}
              onContextMenu={(e) => flag(e, r, c)}
              className={`flex h-8 w-8 items-center justify-center rounded text-sm font-bold transition ${
                cell.revealed
                  ? cell.mine
                    ? "bg-red-500/40"
                    : "bg-white/5"
                  : "bg-white/15 hover:bg-white/20"
              }`}
              style={{ color: NUM_COLORS[cell.count] }}
            >
              {cell.revealed
                ? cell.mine
                  ? "💣"
                  : cell.count || ""
                : cell.flagged
                  ? "🚩"
                  : ""}
            </button>
          )),
        )}
      </div>
      <button onClick={reset} className="rounded-full border border-white/15 px-4 py-1.5 text-xs hover:bg-white/5">
        New game
      </button>
      <p className="text-xs text-white/40">Left-click to reveal · right-click to flag.</p>
    </div>
  );
}
