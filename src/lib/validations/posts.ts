import { z } from "zod";

// Accept absolute http(s) URLs as well as locally-uploaded paths (/uploads/...).
export const mediaUrl = z
  .string()
  .min(1)
  .max(2000)
  .refine((v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"), {
    message: "Must be a valid URL or uploaded file",
  });

export const createPostSchema = z.object({
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "GIF", "POLL", "ARTICLE", "MUSIC", "EVENT"]).default("TEXT"),
  content: z.string().max(5000).optional(),
  images: z.array(z.string().min(1).max(2000)).max(10).optional(),
  videoUrl: mediaUrl.optional(),
  gifUrl: mediaUrl.optional(),
  pollOptions: z.array(z.string().min(1).max(80)).min(2).max(6).optional(),
  communityId: z.string().optional(),
  isReel: z.boolean().optional(),
  requiredTierId: z.string().optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export const reactionSchema = z.object({
  type: z.enum(["LIKE", "LOVE", "LAUGH", "FIRE", "WOW", "SAD", "ANGRY", "CARE", "CLAP"]),
});

export const pollVoteSchema = z.object({
  optionIndex: z.number().int().min(0),
});
