import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
    include: {
      requester: { select: { id: true, username: true, name: true, image: true } },
      addressee: { select: { id: true, username: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const friends = friendships
    .filter((f) => f.status === "ACCEPTED")
    .map((f) => ({
      ...(f.requesterId === userId ? f.addressee : f.requester),
      friendshipId: f.id,
    }));

  const incoming = friendships.filter((f) => f.status === "PENDING" && f.addresseeId === userId);
  const outgoing = friendships.filter((f) => f.status === "PENDING" && f.requesterId === userId);

  return NextResponse.json({ friends, incoming, outgoing });
}
