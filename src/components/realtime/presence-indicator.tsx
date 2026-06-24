"use client";

import { useEffect } from "react";
import { useIsOnline, useLastSeen, usePresence } from "@/lib/presence-store";
import { timeAgo } from "@/lib/time";

type Props = {
  userId: string;
  /** Server-rendered fallback so we can show "active 2h ago" before any socket event. */
  initialLastSeen?: string | null;
  className?: string;
};

/** A dot + text line: "Online now" when present, otherwise "Active {timeAgo}". */
export function PresenceIndicator({ userId, initialLastSeen, className = "" }: Props) {
  const online = useIsOnline(userId);
  const lastSeen = useLastSeen(userId) ?? initialLastSeen ?? null;
  const seedLastSeen = usePresence((s) => s.seedLastSeen);

  useEffect(() => {
    if (initialLastSeen) seedLastSeen({ [userId]: initialLastSeen });
  }, [userId, initialLastSeen, seedLastSeen]);

  if (online) {
    return (
      <span className={`flex items-center gap-1.5 text-xs text-emerald-400 ${className}`}>
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        Online now
      </span>
    );
  }

  if (!lastSeen) return null;

  return (
    <span className={`flex items-center gap-1.5 text-xs text-white/40 ${className}`}>
      <span className="h-2 w-2 rounded-full bg-white/25" />
      Active {timeAgo(lastSeen)} ago
    </span>
  );
}
