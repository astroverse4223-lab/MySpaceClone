import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";
import { getIO } from "@/lib/socket-server";
import { sendPushToUser } from "@/lib/push";

type CreateNotificationInput = {
  /** Recipient user id. */
  userId: string;
  /** Who triggered it. Omitted for system notifications. Self-notifications are skipped. */
  actorId?: string | null;
  type: NotificationType;
  message: string;
  /** In-app link to navigate to when clicked. */
  link?: string | null;
};

/**
 * Create a notification. Never throws — a failed notification must not break the
 * action that triggered it, so callers can safely `await` this inline.
 */
export async function createNotification(input: CreateNotificationInput) {
  if (input.actorId && input.actorId === input.userId) return null;
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        actorId: input.actorId ?? null,
        type: input.type,
        message: input.message,
        link: input.link ?? null,
      },
    });
    getIO()?.to(`user:${input.userId}`).emit("notification:new", notification);

    // Fire a browser push too (best-effort, no-op if push isn't configured or
    // the user has no registered devices). Don't await so a slow push service
    // never delays the request that created the notification.
    void sendPushToUser(input.userId, {
      title: "MySpace Reborn",
      body: input.message,
      url: input.link ?? "/feed",
      tag: input.type,
    });

    return notification;
  } catch {
    return null;
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}
