import type { CSSProperties } from "react";

export type ThemeId =
  | "midnight"
  | "sunset"
  | "vaporwave"
  | "matrix"
  | "bubblegum"
  | "gold"
  | "ocean"
  | "paper";

export type ProfileTheme = {
  id: ThemeId;
  name: string;
  emoji: string;
  /** CSS `background` applied to the full-page backdrop. */
  pageBackground: string;
  /** Default accent (overridable per-profile via accentColor). */
  accent: string;
  /** Card surface + border classes used across profile sections. */
  cardClass: string;
  /** Heading / label text class. */
  mutedText: string;
  /** Whether the page text is dark (light themes) — flips base text color. */
  dark: boolean;
};

export const THEMES: Record<ThemeId, ProfileTheme> = {
  midnight: {
    id: "midnight",
    name: "Midnight",
    emoji: "🌌",
    pageBackground:
      "radial-gradient(800px circle at 15% 0%, rgba(124,58,237,0.25), transparent), radial-gradient(700px circle at 85% 20%, rgba(236,72,153,0.18), transparent), #0a0a0f",
    accent: "#7c3aed",
    cardClass: "border-white/10 bg-white/5",
    mutedText: "text-white/50",
    dark: false,
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
    emoji: "🌅",
    pageBackground: "linear-gradient(160deg, #1a0b2e 0%, #7b2d52 55%, #f97316 130%)",
    accent: "#fb923c",
    cardClass: "border-orange-200/15 bg-black/25",
    mutedText: "text-orange-100/60",
    dark: false,
  },
  vaporwave: {
    id: "vaporwave",
    name: "Vaporwave",
    emoji: "🌴",
    pageBackground:
      "linear-gradient(180deg, #150b3d 0%, #5b2a86 45%, #ff77a9 100%)",
    accent: "#22d3ee",
    cardClass: "border-cyan-300/20 bg-fuchsia-950/30",
    mutedText: "text-cyan-200/70",
    dark: false,
  },
  matrix: {
    id: "matrix",
    name: "Terminal",
    emoji: "💻",
    pageBackground: "radial-gradient(700px circle at 50% 0%, rgba(16,185,129,0.15), transparent), #000300",
    accent: "#22c55e",
    cardClass: "border-green-500/25 bg-green-950/20",
    mutedText: "text-green-400/60",
    dark: false,
  },
  bubblegum: {
    id: "bubblegum",
    name: "Bubblegum",
    emoji: "🍬",
    pageBackground: "linear-gradient(160deg, #ffe1f0 0%, #ffc8dd 45%, #bde0fe 110%)",
    accent: "#db2777",
    cardClass: "border-pink-300/50 bg-white/60",
    mutedText: "text-pink-700/60",
    dark: true,
  },
  gold: {
    id: "gold",
    name: "Black Gold",
    emoji: "👑",
    pageBackground:
      "radial-gradient(700px circle at 50% -10%, rgba(234,179,8,0.22), transparent), #0c0a06",
    accent: "#eab308",
    cardClass: "border-yellow-500/25 bg-yellow-950/10",
    mutedText: "text-yellow-200/50",
    dark: false,
  },
  ocean: {
    id: "ocean",
    name: "Deep Ocean",
    emoji: "🌊",
    pageBackground: "linear-gradient(180deg, #02111f 0%, #053b54 60%, #0e7490 130%)",
    accent: "#38bdf8",
    cardClass: "border-sky-300/20 bg-sky-950/30",
    mutedText: "text-sky-200/60",
    dark: false,
  },
  paper: {
    id: "paper",
    name: "Paper",
    emoji: "📄",
    pageBackground: "linear-gradient(180deg, #faf7f0 0%, #ece5d8 100%)",
    accent: "#b45309",
    cardClass: "border-stone-300 bg-white/70",
    mutedText: "text-stone-500",
    dark: true,
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export function getTheme(id: string | null | undefined): ProfileTheme {
  return THEMES[(id ?? "midnight") as ThemeId] ?? THEMES.midnight;
}

export type FontId = "sans" | "serif" | "mono" | "retro" | "display";

export const FONTS: Record<FontId, { name: string; stack: string }> = {
  sans: { name: "Clean Sans", stack: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" },
  serif: { name: "Elegant Serif", stack: "Georgia, 'Times New Roman', serif" },
  mono: { name: "Monospace", stack: "var(--font-geist-mono), ui-monospace, monospace" },
  retro: { name: "Retro Comic", stack: "'Comic Sans MS', 'Comic Sans', cursive" },
  display: { name: "Display", stack: "'Trebuchet MS', 'Segoe UI', sans-serif" },
};

export const FONT_IDS = Object.keys(FONTS) as FontId[];

export function getFontStack(id: string | null | undefined): string {
  return FONTS[(id ?? "sans") as FontId]?.stack ?? FONTS.sans.stack;
}

/** Inline styles for the full-bleed profile backdrop for a given theme. */
export function themePageStyle(theme: ProfileTheme): CSSProperties {
  return { background: theme.pageBackground };
}
