import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();

  const posts = await prisma.post.findMany({
    where: q ? { content: { contains: q, mode: "insensitive" } } : {},
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { username: true, name: true } },
      _count: { select: { comments: true, reactions: true } },
    },
  });

  const shaped = posts.map((p) => ({
    id: p.id,
    type: p.type,
    isReel: p.isReel,
    content: p.content,
    images: p.images,
    videoUrl: p.videoUrl,
    createdAt: p.createdAt,
    author: p.author,
    commentCount: p._count.comments,
    reactionCount: p._count.reactions,
  }));

  return NextResponse.json({ posts: shaped });
}
