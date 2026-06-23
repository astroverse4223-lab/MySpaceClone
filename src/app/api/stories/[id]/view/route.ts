import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: storyId } = await params;
  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  // createMany + skipDuplicates is race-safe: concurrent view pings (e.g. React
  // StrictMode double-invoke) won't trip the (storyId, userId) unique constraint.
  await prisma.storyView.createMany({
    data: [{ storyId, userId: session.user.id }],
    skipDuplicates: true,
  });

  return NextResponse.json({ success: true });
}
