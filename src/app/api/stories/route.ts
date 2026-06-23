import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createStorySchema } from "@/lib/validations/stories";
import { getAcceptedFriendIds } from "@/lib/friends";

const authorSelect = { id: true, username: true, name: true, image: true } as const;

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const friendIds = await getAcceptedFriendIds(session.user.id);
  const authorIds = [session.user.id, ...friendIds];

  const stories = await prisma.story.findMany({
    where: { authorId: { in: authorIds }, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: authorSelect },
      views: { where: { userId: session.user.id }, select: { userId: true } },
      _count: { select: { views: true } },
    },
  });

  const grouped = new Map<string, { author: (typeof stories)[number]["author"]; stories: typeof stories }>();
  for (const story of stories) {
    if (!grouped.has(story.authorId)) {
      grouped.set(story.authorId, { author: story.author, stories: [] });
    }
    grouped.get(story.authorId)!.stories.push(story);
  }

  const result = Array.from(grouped.values()).map((group) => ({
    author: group.author,
    hasUnseen: group.stories.some((s) => s.views.length === 0),
    stories: group.stories.map((s) => ({
      id: s.id,
      type: s.type,
      mediaUrl: s.mediaUrl,
      content: s.content,
      pollOptions: s.pollOptions,
      pollVotes: s.pollVotes,
      question: s.question,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      seen: s.views.length > 0,
      viewCount: s._count.views,
    })),
  }));

  return NextResponse.json({ groups: result });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createStorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { type, mediaUrl, content, pollOptions, question } = parsed.data;

  if (type === "POLL" && (!pollOptions || pollOptions.length < 2)) {
    return NextResponse.json({ error: "Polls need at least 2 options" }, { status: 400 });
  }
  if (type === "QUESTION" && !question) {
    return NextResponse.json({ error: "Add a question" }, { status: 400 });
  }
  if ((type === "PHOTO" || type === "VIDEO" || type === "MUSIC") && !mediaUrl) {
    return NextResponse.json({ error: "Add a media URL" }, { status: 400 });
  }

  const story = await prisma.story.create({
    data: {
      authorId: session.user.id,
      type,
      mediaUrl,
      content,
      question,
      pollOptions: type === "POLL" ? pollOptions : undefined,
      pollVotes: type === "POLL" ? { counts: pollOptions?.map(() => 0) } : undefined,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    include: { author: { select: authorSelect } },
  });

  return NextResponse.json({ story });
}
