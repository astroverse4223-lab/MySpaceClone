import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reactionSchema } from "@/lib/validations/posts";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const existing = await prisma.reaction.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  });

  if (existing && existing.type === parsed.data.type) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ reaction: null });
  }

  const reaction = await prisma.reaction.upsert({
    where: { postId_userId: { postId, userId: session.user.id } },
    update: { type: parsed.data.type },
    create: { postId, userId: session.user.id, type: parsed.data.type },
  });

  if (!existing) {
    await createNotification({
      userId: post.authorId,
      actorId: session.user.id,
      type: "POST_REACTION",
      message: `@${session.user.username} reacted to your post`,
      link: "/feed",
    });
  }

  return NextResponse.json({ reaction });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  await prisma.reaction.deleteMany({ where: { postId, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
