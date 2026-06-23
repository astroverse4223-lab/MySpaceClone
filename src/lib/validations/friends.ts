import { z } from "zod";

export const sendFriendRequestSchema = z.object({
  username: z.string().min(1),
});

export const createFriendListSchema = z.object({
  name: z.string().min(1).max(40),
});

export const renameFriendListSchema = z.object({
  name: z.string().min(1).max(40),
});

export const addListEntrySchema = z.object({
  friendUserId: z.string().min(1),
});

export const reorderListSchema = z.object({
  entryIds: z.array(z.string()).min(1),
});
