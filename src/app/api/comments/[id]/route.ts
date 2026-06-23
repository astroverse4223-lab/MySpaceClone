import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/admin";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { post: { select: { authorId: true } } },
  });
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  // The commenter, the owner of the post, or a site admin/moderator may delete.
  const canDelete =
    comment.authorId === session.user.id ||
    comment.post.authorId === session.user.id ||
    isStaff(session);

  if (!canDelete) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
