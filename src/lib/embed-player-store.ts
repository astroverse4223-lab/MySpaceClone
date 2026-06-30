import { create } from "zustand";
import { usePlayer } from "@/lib/player-store";
import type { MusicEmbed } from "@/lib/music-embed";

export type ActiveEmbed = MusicEmbed & { label: string };

type EmbedPlayerState = {
  embed: ActiveEmbed | null;
  expanded: boolean;
  play: (embed: ActiveEmbed) => void;
  stop: () => void;
  toggleExpanded: () => void;
};

export const useEmbedPlayer = create<EmbedPlayerState>((set) => ({
  embed: null,
  expanded: true,
  play: (embed) => {
    // Only one "now playing" slot at a time — silence the raw-audio queue
    // (playlists) so a profile song embed doesn't play under it.
    usePlayer.getState().stop();
    set({ embed, expanded: true });
  },
  stop: () => set({ embed: null }),
  toggleExpanded: () => set((s) => ({ expanded: !s.expanded })),
}));
