import { z } from "zod";

export const startConversationSchema = z.object({
  username: z.string().min(1),
});

export const createGroupSchema = z.object({
  name: z.string().min(1).max(50),
  usernames: z.array(z.string()).min(1).max(50),
});

export const sendMessageSchema = z.object({
  content: z.string().max(4000).optional(),
  attachmentUrl: z.string().url().optional(),
  attachmentType: z.enum(["IMAGE", "FILE", "VOICE"]).optional(),
});
