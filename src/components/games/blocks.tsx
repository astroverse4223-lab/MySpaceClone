"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getHighScore, setHighScore } from "@/lib/game-scores";

const COLS = 10;
const ROWS = 18;
const CELL = 20;

type Cell = string | 0;
type Board = Cell[][];

const SHAPES: { cells: number[][]; color: string }[] = [
  { cells: [[1, 1, 1, 1]], color: "#22d3ee" }, // I
  { cells: [[1, 1], [1, 1]], color: "#fde047" }, // O
  { cells: [[0, 1, 0], [1, 1, 1]], color: "#c084fc" }, // T
  { cells: [[0, 1, 1], [1, 1, 0]], color: "#4ade80" }, // S
  { cells: [[1, 1, 0], [0, 1, 1]], color: "#f87171" }, // Z
  { cells: [[1, 0, 0], [1, 1, 1]], color: "#60a5fa" }, // J
  { cells: [[0, 0, 1], [1, 1, 1]], color: "#fb923c" }, // L
];

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0));
}

type Piece = { shape: number[][]; color: string; r: number; c: number };

function randomPiece(): Piece {
  const s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return { shape: s.cells, color: s.color, r: 0, c: Math.floor((COLS - s.cells[0].length) / 2) };
}

function rotate(shape: number[][]): number[][] {
  return shape[0].map((_, i) => shape.map((row) => row[i]).reverse());
}

export function Blocks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [high, setHigh] = useState(0);
  const [status, setStatus] = useState<"idle" | "playing" | "over">("idle");
  const state = useRef({ board: emptyBoard(), piece: randomPiece(), score: 0 });

  useEffect(() => setHigh(getHighScore("blocks")), []);

  const collides = useCallback((board: Board, p: Piece, dr: number, dc: number, shape = p.shape) => {
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nr = p.r + r + dr;
        const nc = p.c + c + dc;
        if (nc < 0 || nc >= COLS || nr >= ROWS) return true;
        if (nr >= 0 && board[nr][nc]) return true;
      }
    return false;
  }, []);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { board, piece } = state.current;
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
    board.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v) {
          ctx.fillStyle = v as string;
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        }
      }),
    );
    piece.shape.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v) {
          ctx.fillStyle = piece.color;
          ctx.fillRect((piece.c + c) * CELL + 1, (piece.r + r) * CELL + 1, CELL - 2, CELL - 2);
        }
      }),
    );
  }, []);

  const lockAndNext = useCallback(() => {
    const s = state.current;
    s.piece.shape.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v && s.piece.r + r >= 0) s.board[s.piece.r + r][s.piece.c + c] = s.piece.color;
      }),
    );
    // clear lines
    let cleared = 0;
    s.board = s.board.filter((row) => {
      if (row.every((v) => v)) {
        cleared++;
        return false;
      }
      return true;
    });
    while (s.board.length < ROWS) s.board.unshift(Array<Cell>(COLS).fill(0));
    if (cleared) {
      s.score += [0, 100, 300, 500, 800][cleared];
      setScore(s.score);
    }
    const next = randomPiece();
    if (collides(s.board, next, 0, 0)) {
      setStatus("over");
      setHigh(setHighScore("blocks", s.score));
    } else {
      s.piece = next;
    }
  }, [collides]);

  const tick = useCallback(() => {
    const s = state.current;
    if (!collides(s.board, s.piece, 1, 0)) {
      s.piece.r++;
    } else {
      lockAndNext();
    }
    draw();
  }, [collides, draw, lockAndNext]);

  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [status, tick]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (status !== "playing") return;
      const s = state.current;
      if (e.key === "ArrowLeft" && !collides(s.board, s.piece, 0, -1)) s.piece.c--;
      else if (e.key === "ArrowRight" && !collides(s.board, s.piece, 0, 1)) s.piece.c++;
      else if (e.key === "ArrowDown" && !collides(s.board, s.piece, 1, 0)) s.piece.r++;
      else if (e.key === "ArrowUp") {
        const rotated = rotate(s.piece.shape);
        if (!collides(s.board, s.piece, 0, 0, rotated)) s.piece.shape = rotated;
      } else return;
      e.preventDefault();
      draw();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, collides, draw]);

  function start() {
    state.current = { board: emptyBoard(), piece: randomPiece(), score: 0 };
    setScore(0);
    setStatus("playing");
    draw();
  }

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full justify-between text-sm text-white/70">
        <span>Score: {score}</span>
        <span>Best: {high}</span>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} className="rounded-lg border border-white/10" />
        {status !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/70">
            {status === "over" && <p className="text-lg font-semibold text-white">Game over · {score}</p>}
            <button onClick={start} className="rounded-full bg-violet-500 px-5 py-2 text-sm font-medium hover:bg-violet-400">
              {status === "idle" ? "Start" : "Play again"}
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-white/40">← → move · ↑ rotate · ↓ drop</p>
    </div>
  );
}
