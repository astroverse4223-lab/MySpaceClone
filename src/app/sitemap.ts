import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// Queries the database, so it must render per-request rather than be
// statically generated at build time (when no database is reachable).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";

  const [users, articles, communities] = await Promise.all([
    prisma.user.findMany({ select: { username: true, updatedAt: true }, take: 1000 }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      take: 1000,
    }),
    prisma.community.findMany({
      where: { visibility: "PUBLIC" },
      select: { slug: true, updatedAt: true },
      take: 1000,
    }),
  ]);

  return [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/communities`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/events`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/dmca`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    ...users.map((u) => ({
      url: `${baseUrl}/profile/${u.username}`,
      lastModified: u.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...articles.map((a) => ({
      url: `${baseUrl}/blog/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...communities.map((c) => ({
      url: `${baseUrl}/communities/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
