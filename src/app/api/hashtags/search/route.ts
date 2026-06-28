import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractHashtags } from "@/lib/text";

// Lightweight hashtag autocomplete: scans recent matching posts and ranks by
// frequency. There's no dedicated Tag table, so this derives tags on the fly.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (q.length < 1) return NextResponse.json({ tags: [] });

  const posts = await prisma.post.findMany({
    where: { content: { contains: `#${q}`, mode: "insensitive" } },
    select: { content: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of extractHashtags(post.content)) {
      if (tag.startsWith(q)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  const tags = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }));

  return NextResponse.json({ tags });
}
