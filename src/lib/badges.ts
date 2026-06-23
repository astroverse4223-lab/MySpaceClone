import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export type BadgeKey =
  | "founding_member"
  | "first_post"
  | "social_butterfly"
  | "popular"
  | "wordsmith"
  | "tastemaker"
  | "community_builder"
  | "generous"
  | "welcomed";

export type BadgeMeta = {
  name: string;
  emoji: string;
  description: string;
  /** Tailwind gradient classes for the badge chip. */
  gradient: string;
};

export const BADGES: Record<BadgeKey, BadgeMeta> = {
  founding_member: {
    name: "Founding Member",
    emoji: "🌟",
    description: "Joined MySpace Reborn during the relaunch.",
    gradient: "from-amber-400 to-yellow-600",
  },
  first_post: {
    name: "First Words",
    emoji: "✍️",
    description: "Shared your first post.",
    gradient: "from-sky-400 to-blue-600",
  },
  social_butterfly: {
    name: "Social Butterfly",
    emoji: "🦋",
    description: "Made 8 or more friends — a full Top 8!",
    gradient: "from-fuchsia-400 to-purple-600",
  },
  popular: {
    name: "Crowd Favorite",
    emoji: "🔥",
    description: "Racked up 25+ reactions across your posts.",
    gradient: "from-orange-400 to-red-600",
  },
  wordsmith: {
    name: "Wordsmith",
    emoji: "📝",
    description: "Published a blog article.",
    gradient: "from-emerald-400 to-green-600",
  },
  tastemaker: {
    name: "Tastemaker",
    emoji: "🎧",
    description: "Curated a playlist for your page.",
    gradient: "from-pink-400 to-rose-600",
  },
  community_builder: {
    name: "Community Builder",
    emoji: "🏛️",
    description: "Founded a community.",
    gradient: "from-cyan-400 to-teal-600",
  },
  generous: {
    name: "Generous Soul",
    emoji: "💝",
    description: "Sent a tip to a creator.",
    gradient: "from-rose-400 to-pink-600",
  },
  welcomed: {
    name: "Welcomed",
    emoji: "📖",
    description: "Received your first guestbook signature.",
    gradient: "from-indigo-400 to-violet-600",
  },
};

export const BADGE_KEYS = Object.keys(BADGES) as BadgeKey[];

/**
 * Recompute and persist every badge a user has earned. Idempotent and safe to
 * call on any profile view — it only ever adds newly-earned badges and notifies
 * the user once per badge. Never throws.
 */
export async function syncBadges(userId: string): Promise<void> {
  try {
    const existing = await prisma.userBadge.findMany({
      where: { userId },
      select: { badge: true },
    });
    const have = new Set(existing.map((b) => b.badge));

    const [postCount, friendCount, articleCount, playlistCount, communityCount, tipCount, guestbookCount, reactionAgg] =
      await Promise.all([
        prisma.post.count({ where: { authorId: userId } }),
        prisma.friendship.count({
          where: {
            status: "ACCEPTED",
            OR: [{ requesterId: userId }, { addresseeId: userId }],
          },
        }),
        prisma.article.count({ where: { authorId: userId, status: "PUBLISHED" } }),
        prisma.playlist.count({ where: { userId } }),
        prisma.community.count({ where: { createdById: userId } }),
        prisma.tip.count({ where: { senderId: userId } }),
        prisma.guestbookEntry.count({ where: { profileUserId: userId } }),
        prisma.reaction.count({ where: { post: { authorId: userId } } }),
      ]);

    const earned: BadgeKey[] = ["founding_member"];
    if (postCount > 0) earned.push("first_post");
    if (friendCount >= 8) earned.push("social_butterfly");
    if (reactionAgg >= 25) earned.push("popular");
    if (articleCount > 0) earned.push("wordsmith");
    if (playlistCount > 0) earned.push("tastemaker");
    if (communityCount > 0) earned.push("community_builder");
    if (tipCount > 0) earned.push("generous");
    if (guestbookCount > 0) earned.push("welcomed");

    const toAward = earned.filter((b) => !have.has(b));
    if (toAward.length === 0) return;

    await prisma.userBadge.createMany({
      data: toAward.map((badge) => ({ userId, badge })),
      skipDuplicates: true,
    });

    for (const badge of toAward) {
      await createNotification({
        userId,
        type: "BADGE",
        message: `You earned the "${BADGES[badge].name}" badge ${BADGES[badge].emoji}`,
        // No link — badges live on your own page; clicking just dismisses it.
        link: null,
      });
    }
  } catch {
    // Badges are a non-critical enhancement; never break the page over them.
  }
}
