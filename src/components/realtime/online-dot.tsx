"use client";

import { useIsOnline } from "@/lib/presence-store";

export function OnlineDot({ userId, className = "" }: { userId: string; className?: string }) {
  const online = useIsOnline(userId);
  if (!online) return null;
  return (
    <span
      title="Online now"
      className={`block rounded-full border-2 border-[#0a0a0f] bg-emerald-400 ${className}`}
    />
  );
}
