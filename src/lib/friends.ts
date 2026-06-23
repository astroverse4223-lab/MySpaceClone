import { prisma } from "@/lib/prisma";

export async function getAcceptedFriendIds(userId: string): Promise<Set<string>> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });

  return new Set(
    friendships.map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId)),
  );
}

export async function ensureDefaultFriendList(userId: string) {
  return prisma.friendList.upsert({
    where: { userId_name: { userId, name: "Top Friends" } },
    update: {},
    create: { userId, name: "Top Friends", isDefault: true },
  });
}
