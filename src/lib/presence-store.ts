import { create } from "zustand";

type PresenceState = {
  online: Set<string>;
  setSnapshot: (ids: string[]) => void;
  setOnline: (id: string, online: boolean) => void;
};

export const usePresence = create<PresenceState>((set) => ({
  online: new Set<string>(),
  setSnapshot: (ids) => set({ online: new Set(ids) }),
  setOnline: (id, online) =>
    set((s) => {
      const next = new Set(s.online);
      if (online) next.add(id);
      else next.delete(id);
      return { online: next };
    }),
}));

/** Subscribe to a single user's online state (re-renders only when it flips). */
export function useIsOnline(userId: string | null | undefined): boolean {
  return usePresence((s) => (userId ? s.online.has(userId) : false));
}
