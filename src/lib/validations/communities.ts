import { z } from "zod";
import { mediaUrl } from "./posts";

export const createCommunitySchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(500).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

export const createAnnouncementSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["MEMBER", "MODERATOR", "ADMIN"]),
});

export const updateCommunitySchema = z.object({
  description: z.string().max(500).optional(),
  themeColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  bannerImage: mediaUrl.optional(),
  iconImage: mediaUrl.optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});
