import { prisma } from "@/lib/prisma";

/**
 * IDs the viewer should not see content from: people they blocked AND people
 * who blocked them. Use to filter feeds, suggestions, search, etc.
 */
export async function getBlockedUserIds(userId: string | undefined | null): Promise<string[]> {
  if (!userId) return [];
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const b of blocks) {
    ids.add(b.blockerId === userId ? b.blockedId : b.blockerId);
  }
  return [...ids];
}
