import { z } from "zod";

export const listingConditions = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "WORN"] as const;
export const listingStatuses = ["ACTIVE", "PENDING", "SOLD"] as const;

export const listingCategories = [
  "Furniture",
  "Electronics",
  "Clothing",
  "Vehicles",
  "Free stuff",
  "Home & Garden",
  "Hobbies",
  "Other",
] as const;

export const createListingSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  priceCents: z.number().int().min(0).max(100_000_000),
  category: z.string().min(1).max(50),
  condition: z.enum(listingConditions).default("GOOD"),
  location: z.string().min(1).max(100),
  images: z.array(z.string().url()).max(8).default([]),
});

export const updateListingSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(2000).optional(),
  priceCents: z.number().int().min(0).max(100_000_000).optional(),
  category: z.string().min(1).max(50).optional(),
  condition: z.enum(listingConditions).optional(),
  location: z.string().min(1).max(100).optional(),
  images: z.array(z.string().url()).max(8).optional(),
  status: z.enum(listingStatuses).optional(),
});
