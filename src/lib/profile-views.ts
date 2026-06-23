import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

const VIEW_DEDUP_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Record a profile view. Increments the owner's total view count and tracks the
 * distinct viewer for the "who viewed me" list. Notifies the owner only the
 * first time a given viewer shows up (to avoid spam). Anonymous views still
 * bump the counter but aren't tracked individually. Never throws.
 */
export async function recordProfileView(profileUserId: string, viewerId: string | null): Promise<void> {
  if (viewerId === profileUserId) return;
  try {
    if (!viewerId) {
      await prisma.profile.update({
        where: { userId: profileUserId },
        data: { profileViews: { increment: 1 } },
      });
      return;
    }

    const existing = await prisma.profileView.findUnique({
      where: { profileUserId_viewerId: { profileUserId, viewerId } },
      select: { viewedAt: true },
    });

    const now = Date.now();
    const isNew = !existing;
    const stale = existing ? now - existing.viewedAt.getTime() > VIEW_DEDUP_MS : true;

    await prisma.profileView.upsert({
      where: { profileUserId_viewerId: { profileUserId, viewerId } },
      create: { profileUserId, viewerId },
      update: { viewedAt: new Date() },
    });

    if (stale) {
      await prisma.profile.update({
        where: { userId: profileUserId },
        data: { profileViews: { increment: 1 } },
      });
    }

    if (isNew) {
      const viewer = await prisma.user.findUnique({
        where: { id: viewerId },
        select: { username: true },
      });
      if (viewer) {
        await createNotification({
          userId: profileUserId,
          actorId: viewerId,
          type: "PROFILE_VIEW",
          message: `@${viewer.username} checked out your page`,
          link: `/profile/${viewer.username}`,
        });
      }
    }
  } catch {
    // View tracking is best-effort.
  }
}
