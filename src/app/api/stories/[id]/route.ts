import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const story = await prisma.story.findUnique({ where: { id } });
  if (!story || story.authorId !== session.user.id) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  await prisma.story.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
