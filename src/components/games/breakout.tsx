"use client";

import { useEffect, useRef, useState } from "react";
import { getHighScore, setHighScore } from "@/lib/game-scores";

const W = 360;
const H = 420;
const COLS = 7;
const ROWS = 5;
const BRICK_H = 18;
const PAD_W = 70;

export function Breakout() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [high, setHigh] = useState(0);
  const [status, setStatus] = useState<"idle" | "playing" | "won" | "lost">("idle");

  const game = useRef({
    ball: { x: W / 2, y: H - 40, dx: 3, dy: -3 },
    padX: W / 2 - PAD_W / 2,
    bricks: [] as { x: number; y: number; alive: boolean }[],
    score: 0,
  });

  useEffect(() => setHigh(getHighScore("breakout")), []);

  function initBricks() {
    const bw = W / COLS;
    const bricks = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        bricks.push({ x: c * bw, y: 40 + r * (BRICK_H + 6), alive: true });
    return bricks;
  }

  function start() {
    game.current = {
      ball: { x: W / 2, y: H - 40, dx: 3, dy: -3 },
      padX: W / 2 - PAD_W / 2,
      bricks: initBricks(),
      score: 0,
    };
    setScore(0);
    setStatus("playing");
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      game.current.padX = Math.max(0, Math.min(W - PAD_W, e.clientX - rect.left - PAD_W / 2));
    }
    const c = canvasRef.current;
    c?.addEventListener("mousemove", onMove);
    return () => c?.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    if (status !== "playing") return;
    const bw = W / COLS;
    const id = setInterval(() => {
      const g = game.current;
      const b = g.ball;
      b.x += b.dx;
      b.y += b.dy;
      if (b.x < 6 || b.x > W - 6) b.dx *= -1;
      if (b.y < 6) b.dy *= -1;
      // paddle
      if (b.y > H - 24 && b.y < H - 10 && b.x > g.padX && b.x < g.padX + PAD_W) {
        b.dy = -Math.abs(b.dy);
        b.dx += ((b.x - (g.padX + PAD_W / 2)) / (PAD_W / 2)) * 1.5;
      }
      if (b.y > H) {
        setStatus("lost");
        setHigh(setHighScore("breakout", g.score));
        return;
      }
      // bricks
      for (const brk of g.bricks) {
        if (!brk.alive) continue;
        if (b.x > brk.x && b.x < brk.x + bw && b.y > brk.y && b.y < brk.y + BRICK_H) {
          brk.alive = false;
          b.dy *= -1;
          g.score += 10;
          setScore(g.score);
          break;
        }
      }
      if (g.bricks.every((br) => !br.alive)) {
        setStatus("won");
        setHigh(setHighScore("breakout", g.score));
        return;
      }
      // draw
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, W, H);
      g.bricks.forEach((br, i) => {
        if (!br.alive) return;
        ctx.fillStyle = `hsl(${(i * 25) % 360} 70% 60%)`;
        ctx.fillRect(br.x + 2, br.y, bw - 4, BRICK_H);
      });
      ctx.fillStyle = "#a78bfa";
      ctx.fillRect(g.padX, H - 18, PAD_W, 10);
      ctx.beginPath();
      ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }, 16);
    return () => clearInterval(id);
  }, [status]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full justify-between text-sm text-white/70">
        <span>Score: {score}</span>
        <span>Best: {high}</span>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="rounded-lg border border-white/10" />
        {status !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/70">
            {status === "won" && <p className="text-lg font-semibold text-emerald-300">You cleared it! · {score}</p>}
            {status === "lost" && <p className="text-lg font-semibold text-white">Game over · {score}</p>}
            <button onClick={start} className="rounded-full bg-violet-500 px-5 py-2 text-sm font-medium hover:bg-violet-400">
              {status === "idle" ? "Start" : "Play again"}
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-white/40">Move your mouse to control the paddle.</p>
    </div>
  );
}
