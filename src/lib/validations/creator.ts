import { z } from "zod";

export const createTierSchema = z.object({
  name: z.string().min(1).max(40),
  description: z.string().max(300).optional(),
  priceCents: z.number().int().min(100).max(100000),
  interval: z.enum(["MONTH", "YEAR"]).default("MONTH"),
});

export const tipSchema = z.object({
  creatorUsername: z.string().min(1),
  amountCents: z.number().int().min(100).max(100000),
  message: z.string().max(300).optional(),
});

export const checkoutSchema = z.object({
  tierId: z.string().min(1),
});
