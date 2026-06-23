import { z } from "zod";
import { mediaUrl } from "./posts";

export const createStorySchema = z.object({
  type: z.enum(["PHOTO", "VIDEO", "MUSIC", "POLL", "QUESTION"]),
  mediaUrl: mediaUrl.optional(),
  content: z.string().max(500).optional(),
  pollOptions: z.array(z.string().min(1).max(60)).min(2).max(4).optional(),
  question: z.string().max(200).optional(),
});

export const storyPollVoteSchema = z.object({
  optionIndex: z.number().int().min(0),
});
