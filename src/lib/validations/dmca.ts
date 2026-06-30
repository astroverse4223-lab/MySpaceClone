import { z } from "zod";

export const submitDmcaSchema = z.object({
  complainantName: z.string().min(1).max(200),
  complainantEmail: z.string().email(),
  contentType: z.enum(["PROFILE_SONG", "PLAYLIST_TRACK", "POST", "OTHER"]),
  contentUrl: z.string().min(1).max(2000),
  targetUsername: z.string().max(50).optional(),
  description: z.string().min(20).max(2000),
  goodFaithStatement: z.literal(true, {
    message: "You must confirm the good-faith statement",
  }),
  accuracyStatement: z.literal(true, {
    message: "You must confirm the accuracy/perjury statement",
  }),
  signature: z.string().min(2).max(200),
});

export type SubmitDmcaInput = z.infer<typeof submitDmcaSchema>;
