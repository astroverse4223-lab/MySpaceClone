import { create } from "zustand";

export type Track = {
  id: string;
  url: string;
  title: string;
  subtitle?: string | null;
};

type PlayerState = {
  queue: Track[];
  index: number;
  isPlaying: boolean;
  /** Bumps whenever a play is requested so the audio element seeks to start. */
  playToken: number;
  current: () => Track | null;
  playTrack: (track: Track) => void;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  toggle: () => void;
  setPlaying: (playing: boolean) => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
};

export const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  index: 0,
  isPlaying: false,
  playToken: 0,
  current: () => {
    const { queue, index } = get();
    return queue[index] ?? null;
  },
  playTrack: (track) =>
    set((s) => ({ queue: [track], index: 0, isPlaying: true, playToken: s.playToken + 1 })),
  playQueue: (tracks, startIndex = 0) =>
    set((s) =>
      tracks.length
        ? { queue: tracks, index: Math.min(startIndex, tracks.length - 1), isPlaying: true, playToken: s.playToken + 1 }
        : s,
    ),
  toggle: () => set((s) => ({ isPlaying: s.queue.length ? !s.isPlaying : false })),
  setPlaying: (playing) => set({ isPlaying: playing }),
  next: () =>
    set((s) => {
      if (s.index < s.queue.length - 1) {
        return { index: s.index + 1, isPlaying: true, playToken: s.playToken + 1 };
      }
      return { isPlaying: false };
    }),
  prev: () =>
    set((s) => ({ index: Math.max(0, s.index - 1), isPlaying: true, playToken: s.playToken + 1 })),
  stop: () => set({ isPlaying: false }),
}));
