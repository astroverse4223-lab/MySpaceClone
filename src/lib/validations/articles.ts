import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().min(1).max(150),
  excerpt: z.string().max(300).optional(),
  content: z.string().min(1),
  coverImage: z.string().url().optional(),
  category: z.string().max(40).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});

export const updateArticleSchema = createArticleSchema.partial();
