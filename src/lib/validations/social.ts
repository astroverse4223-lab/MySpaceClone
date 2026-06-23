import { z } from "zod";

export const guestbookEntrySchema = z.object({
  content: z.string().trim().min(1, "Say something!").max(500, "Keep it under 500 characters"),
});

export type GuestbookEntryInput = z.infer<typeof guestbookEntrySchema>;
