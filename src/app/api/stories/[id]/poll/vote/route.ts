import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { storyPollVoteSchema } from "@/lib/validations/stories";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: storyId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = storyPollVoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story || story.type !== "POLL" || !Array.isArray(story.pollOptions)) {
    return NextResponse.json({ error: "This story isn't a poll" }, { status: 400 });
  }

  const options = story.pollOptions as string[];
  if (parsed.data.optionIndex >= options.length) {
    return NextResponse.json({ error: "Invalid option" }, { status: 400 });
  }

  const voterKey = `voter:${session.user.id}`;
  const votes = (story.pollVotes as Record<string, unknown>) ?? {};
  if (votes[voterKey] !== undefined) {
    return NextResponse.json({ error: "You already voted" }, { status: 409 });
  }

  const counts = Array.isArray(votes.counts) ? (votes.counts as number[]) : options.map(() => 0);
  counts[parsed.data.optionIndex] = (counts[parsed.data.optionIndex] ?? 0) + 1;

  const updated = await prisma.story.update({
    where: { id: storyId },
    data: {
      pollVotes: { ...votes, counts, [voterKey]: parsed.data.optionIndex } as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ pollVotes: updated.pollVotes });
}
