import { z } from "zod";
import { THEME_IDS } from "@/lib/themes";
import { FONT_IDS } from "@/lib/themes";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #7c3aed");

export const profileUpdateSchema = z.object({
  displayName: z.string().max(50).optional(),
  headline: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  mood: z.string().max(40).optional(),
  moodEmoji: z.string().max(8).optional(),
  theme: z.enum(THEME_IDS as [string, ...string[]]).optional(),
  accentColor: hexColor.optional(),
  fontFamily: z.enum(FONT_IDS as [string, ...string[]]).optional(),
  themeColor: hexColor.optional(),
  avatarImage: z.string().max(500).optional(),
  coverImage: z.string().max(500).optional(),
  backgroundImage: z.string().max(500).optional(),
  profileSongUrl: z.string().max(500).optional(),
  profileSongTitle: z.string().max(100).optional(),
  interests: z.array(z.string().max(30)).max(20).optional(),
  links: z
    .array(
      z.object({
        label: z.string().max(30),
        url: z.string().url(),
      }),
    )
    .max(10)
    .optional(),
  favoriteArtists: z.array(z.string().max(50)).max(20).optional(),
  cursorEffect: z
    .enum([
      "none",
      "sparkles",
      "hearts",
      "stars",
      "bubbles",
      "neon",
      "matrix",
      "fire",
      "lightning",
      "skulls",
      "smoke",
      "frost",
      "vortex",
    ])
    .optional(),
  glitter: z.boolean().optional(),
  bgEffect: z
    .enum(["none", "glitter", "starfield", "aurora", "grid", "embers", "snow", "rain", "nebula"])
    .optional(),
  stickers: z
    .array(
      z.object({
        emoji: z.string().max(12),
        x: z.number().min(0).max(100),
        y: z.number().min(0).max(100),
      }),
    )
    .max(20)
    .optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
