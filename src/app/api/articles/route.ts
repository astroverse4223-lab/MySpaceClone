import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createArticleSchema } from "@/lib/validations/articles";
import { slugify } from "@/lib/slug";

const authorSelect = { id: true, username: true, name: true, image: true } as const;

export async function GET(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  const authorUsername = url.searchParams.get("author");
  const category = url.searchParams.get("category") ?? undefined;
  const mine = url.searchParams.get("mine") === "true";

  if (mine) {
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const articles = await prisma.article.findMany({
      where: { authorId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: { author: { select: authorSelect } },
    });
    return NextResponse.json({ articles });
  }

  let authorId: string | undefined;
  if (authorUsername) {
    const author = await prisma.user.findUnique({ where: { username: authorUsername } });
    if (!author) return NextResponse.json({ articles: [] });
    authorId = author.id;
  }

  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", ...(authorId ? { authorId } : {}), ...(category ? { category } : {}) },
    orderBy: { publishedAt: "desc" },
    include: { author: { select: authorSelect } },
    take: 50,
  });

  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createArticleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const baseSlug = slugify(parsed.data.title);
  let slug = baseSlug || "article";
  let suffix = 1;
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const article = await prisma.article.create({
    data: {
      authorId: session.user.id,
      slug,
      ...parsed.data,
      publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
    },
    include: { author: { select: authorSelect } },
  });

  return NextResponse.json({ article });
}
