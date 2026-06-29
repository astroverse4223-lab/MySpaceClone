import { z } from "zod";

export const updateUserSchema = z.object({
  role: z.enum(["USER", "MODERATOR", "ADMIN"]).optional(),
  isSuspended: z.boolean().optional(),
  suspendedReason: z.string().max(300).optional(),
  verifyEmail: z.boolean().optional(),
});

export const grantBadgeSchema = z.object({
  badge: z.string().min(1).max(50),
  action: z.enum(["grant", "remove"]).default("grant"),
});

export const createBulletinSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(1000),
  type: z.enum(["FEATURE", "MAINTENANCE", "UPDATE", "GENERAL"]).default("UPDATE"),
  link: z.string().max(500).optional(),
  pinned: z.boolean().optional(),
});

export const createReportSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "USER", "COMMUNITY", "ARTICLE"]),
  targetId: z.string().min(1),
  reason: z.string().min(1).max(500),
});

export const resolveReportSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]),
});
