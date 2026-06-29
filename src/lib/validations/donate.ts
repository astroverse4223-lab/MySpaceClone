import { z } from "zod";

export const donateSchema = z.object({
  amountCents: z.number().int().min(100).max(100000),
  message: z.string().max(300).optional(),
});
