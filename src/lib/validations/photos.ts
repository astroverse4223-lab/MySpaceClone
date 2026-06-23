import { z } from "zod";
import { mediaUrl } from "./posts";

export const createAlbumSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional(),
});

export const updateAlbumSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(300).optional(),
  coverImage: mediaUrl.optional(),
});

export const createPhotoSchema = z.object({
  url: mediaUrl,
  caption: z.string().max(300).optional(),
  albumId: z.string().optional(),
});
