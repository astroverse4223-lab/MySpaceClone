import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pollVoteSchema } from "@/lib/validations/posts";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = pollVoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.type !== "POLL" || !Array.isArray(post.pollOptions)) {
    return NextResponse.json({ error: "This post isn't a poll" }, { status: 400 });
  }

  const options = post.pollOptions as string[];
  if (parsed.data.optionIndex >= options.length) {
    return NextResponse.json({ error: "Invalid option" }, { status: 400 });
  }

  const voterKey = `voter:${session.user.id}`;
  const votes = (post.pollVotes as Record<string, unknown>) ?? {};
  if (votes[voterKey] !== undefined) {
    return NextResponse.json({ error: "You already voted" }, { status: 409 });
  }

  const counts = Array.isArray(votes.counts) ? (votes.counts as number[]) : options.map(() => 0);
  counts[parsed.data.optionIndex] = (counts[parsed.data.optionIndex] ?? 0) + 1;

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      pollVotes: { ...votes, counts, [voterKey]: parsed.data.optionIndex } as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ pollVotes: updated.pollVotes });
}
