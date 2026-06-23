import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCommunitySchema } from "@/lib/validations/communities";
import { slugify } from "@/lib/slug";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();

  const communities = await prisma.community.findMany({
    where: {
      visibility: "PUBLIC",
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { _count: { select: { members: true } } },
  });

  return NextResponse.json({ communities });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCommunitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const baseSlug = slugify(parsed.data.name);
  if (!baseSlug) {
    return NextResponse.json({ error: "Please use a name with some letters or numbers" }, { status: 400 });
  }

  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.community.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const community = await prisma.community.create({
    data: {
      slug,
      name: parsed.data.name,
      description: parsed.data.description,
      visibility: parsed.data.visibility,
      createdById: session.user.id,
      members: { create: [{ userId: session.user.id, role: "OWNER" }] },
    },
  });

  return NextResponse.json({ community });
}
