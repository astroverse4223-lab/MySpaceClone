import type { Prisma } from "@prisma/client";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// The site owner. Always has full admin access regardless of stored role.
export const ADMIN_EMAIL = "countryboya20@gmail.com";

export function isOwner(session: Session | null | undefined): boolean {
  return session?.user?.email?.toLowerCase() === ADMIN_EMAIL;
}

/** Owner email OR an ADMIN-role account. Use for destructive/owner-level tools. */
export function isPrivilegedAdmin(session: Session | null | undefined): boolean {
  return isOwner(session) || session?.user?.role === "ADMIN";
}

/** Owner email, ADMIN, or MODERATOR. Use for general moderation routes. */
export function isStaff(session: Session | null | undefined): boolean {
  return isPrivilegedAdmin(session) || session?.user?.role === "MODERATOR";
}

export async function requireAdmin() {
  const session = await auth();
  if (!isStaff(session)) {
    return null;
  }
  return session;
}

/** Returns the session only if the viewer is the owner or an ADMIN. */
export async function requirePrivilegedAdmin() {
  const session = await auth();
  if (!isPrivilegedAdmin(session)) {
    return null;
  }
  return session;
}

export async function logAudit(
  actorId: string,
  action: string,
  target?: { type: string; id: string },
  metadata?: Record<string, unknown>,
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetType: target?.type,
      targetId: target?.id,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
