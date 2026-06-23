"use client";

import Link from "next/link";
import { usePlayer } from "@/lib/player-store";
import { useToasts } from "@/lib/toast-store";

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  const playerActive = usePlayer((s) => s.queue.length > 0);

  if (toasts.length === 0) return null;

  return (
    <div className={`fixed left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2 ${playerActive ? "bottom-24" : "bottom-6"}`}>
      {toasts.map((t) => {
        const inner = (
          <div className="animate-pop-in flex items-center gap-3 rounded-full border border-white/10 bg-[#0c0c14]/95 py-2.5 pl-3 pr-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-base">{t.emoji}</span>
            <span className="max-w-[240px] truncate text-sm text-white/90">{t.message}</span>
          </div>
        );
        return t.href ? (
          <Link key={t.id} href={t.href} onClick={() => dismiss(t.id)}>
            {inner}
          </Link>
        ) : (
          <button key={t.id} onClick={() => dismiss(t.id)}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}
