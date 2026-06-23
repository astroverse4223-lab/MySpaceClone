import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const userSelect = { id: true, username: true, name: true, image: true } as const;

// GET /api/stories/[id]/insights → who viewed + reacted (author only).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: storyId } = await params;
  const story = await prisma.story.findUnique({ where: { id: storyId }, select: { authorId: true } });
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  if (story.authorId !== session.user.id) {
    return NextResponse.json({ error: "Only the author can see insights" }, { status: 403 });
  }

  const [views, reactions] = await Promise.all([
    prisma.storyView.findMany({
      where: { storyId },
      orderBy: { viewedAt: "desc" },
      include: { user: { select: userSelect } },
    }),
    prisma.storyReaction.findMany({
      where: { storyId },
      include: { user: { select: userSelect } },
    }),
  ]);

  const reactionByUser = new Map(reactions.map((r) => [r.userId, r.emoji]));

  // Merge: everyone who viewed, plus their reaction (if any). Include reactors
  // who somehow have no view row too.
  const seen = new Set<string>();
  const viewers = views.map((v) => {
    seen.add(v.userId);
    return { user: v.user, emoji: reactionByUser.get(v.userId) ?? null, viewedAt: v.viewedAt };
  });
  for (const r of reactions) {
    if (!seen.has(r.userId)) {
      viewers.push({ user: r.user, emoji: r.emoji, viewedAt: r.createdAt });
    }
  }

  return NextResponse.json({
    viewers,
    viewCount: views.length,
    reactionCount: reactions.length,
  });
}
