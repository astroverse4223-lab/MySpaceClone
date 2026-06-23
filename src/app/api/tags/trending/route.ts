import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractHashtags } from "@/lib/text";

// GET /api/tags/trending → most-used hashtags from recent posts.
export async function GET() {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const posts = await prisma.post.findMany({
    where: { createdAt: { gte: since }, content: { contains: "#" } },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { content: true },
  });

  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const tag of extractHashtags(p.content)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  const trending = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  return NextResponse.json({ trending });
}
