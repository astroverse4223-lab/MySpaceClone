import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createListingSchema } from "@/lib/validations/marketplace";

const sellerSelect = { id: true, username: true, name: true, image: true } as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const minPrice = url.searchParams.get("minPrice");
  const maxPrice = url.searchParams.get("maxPrice");
  const mine = url.searchParams.get("mine") === "1";

  const session = await auth();

  const listings = await prisma.listing.findMany({
    where: {
      ...(mine && session?.user ? { sellerId: session.user.id } : { status: "ACTIVE" }),
      ...(category ? { category } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
      ...(minPrice || maxPrice
        ? {
            priceCents: {
              ...(minPrice ? { gte: Number(minPrice) } : {}),
              ...(maxPrice ? { lte: Number(maxPrice) } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { seller: { select: sellerSelect } },
    take: 60,
  });

  return NextResponse.json({ listings });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: { sellerId: session.user.id, ...parsed.data },
    include: { seller: { select: sellerSelect } },
  });

  return NextResponse.json({ listing });
}
