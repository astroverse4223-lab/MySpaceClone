"use client";

import { useEffect, useRef, useState } from "react";
import { getHighScore, setHighScore } from "@/lib/game-scores";
import { useCallbackRef } from "./use-callback-ref";

const SIZE = 20; // grid cells
const CELL = 18; // px

type Point = { x: number; y: number };

export function Snake() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [high, setHigh] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const stateRef = useRef({
    snake: [{ x: 10, y: 10 }] as Point[],
    dir: { x: 1, y: 0 } as Point,
    nextDir: { x: 1, y: 0 } as Point,
    food: { x: 5, y: 5 } as Point,
    score: 0,
  });

  useEffect(() => setHigh(getHighScore("snake")), []);

  const draw = useCallbackRef(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, SIZE * CELL, SIZE * CELL);
    const s = stateRef.current;
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(s.food.x * CELL, s.food.y * CELL, CELL - 1, CELL - 1);
    s.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? "#a78bfa" : "#7c3aed";
      ctx.fillRect(p.x * CELL, p.y * CELL, CELL - 1, CELL - 1);
    });
  });

  function reset() {
    stateRef.current = {
      snake: [{ x: 10, y: 10 }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) },
      score: 0,
    };
    setScore(0);
    setGameOver(false);
    setRunning(true);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const s = stateRef.current;
      const k = e.key;
      if (k === "ArrowUp" && s.dir.y !== 1) s.nextDir = { x: 0, y: -1 };
      else if (k === "ArrowDown" && s.dir.y !== -1) s.nextDir = { x: 0, y: 1 };
      else if (k === "ArrowLeft" && s.dir.x !== 1) s.nextDir = { x: -1, y: 0 };
      else if (k === "ArrowRight" && s.dir.x !== -1) s.nextDir = { x: 1, y: 0 };
      if (k.startsWith("Arrow")) e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const s = stateRef.current;
      s.dir = s.nextDir;
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
      if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= SIZE ||
        head.y >= SIZE ||
        s.snake.some((p) => p.x === head.x && p.y === head.y)
      ) {
        setRunning(false);
        setGameOver(true);
        setHigh(setHighScore("snake", s.score));
        return;
      }
      s.snake.unshift(head);
      if (head.x === s.food.x && head.y === s.food.y) {
        s.score += 1;
        setScore(s.score);
        s.food = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) };
      } else {
        s.snake.pop();
      }
      draw();
    }, 110);
    return () => clearInterval(id);
  }, [running, draw]);

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
        <canvas
          ref={canvasRef}
          width={SIZE * CELL}
          height={SIZE * CELL}
          className="rounded-lg border border-white/10"
        />
        {(!running || gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/70">
            {gameOver && <p className="text-lg font-semibold text-white">Game over · {score}</p>}
            <button
              onClick={reset}
              className="rounded-full bg-violet-500 px-5 py-2 text-sm font-medium hover:bg-violet-400"
            >
              {gameOver ? "Play again" : "Start"}
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-white/40">Use arrow keys to move.</p>
    </div>
  );
}
