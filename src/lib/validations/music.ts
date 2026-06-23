import { z } from "zod";

export const createPlaylistSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(300).optional(),
  coverImage: z.string().url().optional(),
});

export const addTrackSchema = z.object({
  title: z.string().min(1).max(100),
  artist: z.string().min(1).max(100),
  coverUrl: z.string().url().optional(),
  externalUrl: z.string().url().optional(),
});

export const favoriteArtistsSchema = z.object({
  favoriteArtists: z.array(z.string().min(1).max(50)).max(20),
});
