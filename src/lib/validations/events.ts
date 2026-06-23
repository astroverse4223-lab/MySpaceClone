import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  coverImage: z.string().url().optional(),
  isOnline: z.boolean().default(false),
  location: z.string().max(200).optional(),
  onlineUrl: z.string().url().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  communityId: z.string().optional(),
});

export const rsvpSchema = z.object({
  status: z.enum(["GOING", "INTERESTED", "NOT_GOING"]),
});
