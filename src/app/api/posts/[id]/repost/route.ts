import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  const body = await request.json().catch(() => ({}));
  const comment = typeof body?.comment === "string" ? body.comment.slice(0, 500) : undefined;

  const existing = await prisma.repost.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.repost.delete({ where: { id: existing.id } });
    return NextResponse.json({ reposted: false });
  }

  await prisma.repost.create({ data: { postId, userId: session.user.id, comment } });
  return NextResponse.json({ reposted: true });
}
