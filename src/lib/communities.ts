import { prisma } from "@/lib/prisma";

const STAFF_ROLES = new Set(["MODERATOR", "ADMIN", "OWNER"]);

export async function getMembership(communityId: string, userId: string) {
  return prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
  });
}

export async function requireStaff(communityId: string, userId: string) {
  const membership = await getMembership(communityId, userId);
  if (!membership || !STAFF_ROLES.has(membership.role)) {
    return null;
  }
  return membership;
}
