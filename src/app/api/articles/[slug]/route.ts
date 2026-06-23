import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateArticleSchema } from "@/lib/validations/articles";

const authorSelect = { id: true, username: true, name: true, image: true } as const;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;

  const article = await prisma.article.findUnique({
    where: { slug },
    include: { author: { select: authorSelect } },
  });

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const isOwner = session?.user?.id === article.authorId;
  if (article.status === "DRAFT" && !isOwner) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  if (article.status === "PUBLISHED" && !isOwner) {
    await prisma.article.update({ where: { slug }, data: { viewCount: { increment: 1 } } });
  }

  return NextResponse.json({ article });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article || article.authorId !== session.user.id) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateArticleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const wasPublished = article.status === "PUBLISHED";
  const willPublish = parsed.data.status === "PUBLISHED";

  const updated = await prisma.article.update({
    where: { slug },
    data: {
      ...parsed.data,
      publishedAt: !wasPublished && willPublish ? new Date() : undefined,
    },
    include: { author: { select: authorSelect } },
  });

  return NextResponse.json({ article: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article || article.authorId !== session.user.id) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  await prisma.article.delete({ where: { slug } });
  return NextResponse.json({ success: true });
}
