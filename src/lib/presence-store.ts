import { create } from "zustand";

type PresenceState = {
  online: Set<string>;
  /** userId -> ISO timestamp of when they were last seen online. */
  lastSeen: Record<string, string>;
  setSnapshot: (ids: string[]) => void;
  setOnline: (id: string, online: boolean, lastSeenAt?: string | null) => void;
  /** Seed last-seen times from server-rendered data (does not affect online set). */
  seedLastSeen: (entries: Record<string, string | null | undefined>) => void;
};

export const usePresence = create<PresenceState>((set) => ({
  online: new Set<string>(),
  lastSeen: {},
  setSnapshot: (ids) => set({ online: new Set(ids) }),
  setOnline: (id, online, lastSeenAt) =>
    set((s) => {
      const next = new Set(s.online);
      if (online) next.add(id);
      else next.delete(id);
      const lastSeen = lastSeenAt ? { ...s.lastSeen, [id]: lastSeenAt } : s.lastSeen;
      return { online: next, lastSeen };
    }),
  seedLastSeen: (entries) =>
    set((s) => {
      const lastSeen = { ...s.lastSeen };
      for (const [id, ts] of Object.entries(entries)) {
        if (ts && !lastSeen[id]) lastSeen[id] = ts;
      }
      return { lastSeen };
    }),
}));

/** Subscribe to a single user's online state (re-renders only when it flips). */
export function useIsOnline(userId: string | null | undefined): boolean {
  return usePresence((s) => (userId ? s.online.has(userId) : false));
}

/** Last-seen ISO timestamp for a user (null if unknown / they were never tracked). */
export function useLastSeen(userId: string | null | undefined): string | null {
  return usePresence((s) => (userId ? s.lastSeen[userId] ?? null : null));
}
