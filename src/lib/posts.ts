import { prisma } from "@/lib/prisma";
import type { Post, Reaction, Comment, Bookmark, Repost } from "@prisma/client";

type PostWithRelations = Post & {
  author: { id: string; username: string; name: string | null; image: string | null };
  reactions: Reaction[];
  _count: { comments: number; reposts: number };
};

export async function serializePosts(posts: PostWithRelations[], viewerId?: string) {
  const postIds = posts.map((p) => p.id);
  const gatedTierIds = Array.from(new Set(posts.map((p) => p.requiredTierId).filter((id): id is string => Boolean(id))));

  const [viewerReactions, viewerBookmarks, viewerReposts, activeSubscriptions] = await Promise.all([
    viewerId ? prisma.reaction.findMany({ where: { postId: { in: postIds }, userId: viewerId } }) : Promise.resolve([] as Reaction[]),
    viewerId ? prisma.bookmark.findMany({ where: { postId: { in: postIds }, userId: viewerId } }) : Promise.resolve([] as Bookmark[]),
    viewerId ? prisma.repost.findMany({ where: { postId: { in: postIds }, userId: viewerId } }) : Promise.resolve([] as Repost[]),
    viewerId && gatedTierIds.length
      ? prisma.subscription.findMany({
          where: { subscriberId: viewerId, tierId: { in: gatedTierIds }, status: "ACTIVE" },
          select: { tierId: true },
        })
      : Promise.resolve([]),
  ]);

  const viewerReactionByPost = new Map(viewerReactions.map((r) => [r.postId, r.type]));
  const bookmarkedPosts = new Set(viewerBookmarks.map((b) => b.postId));
  const repostedPosts = new Set(viewerReposts.map((r) => r.postId));
  const unlockedTierIds = new Set(activeSubscriptions.map((s) => s.tierId));

  return posts.map((post) => {
    const counts: Record<string, number> = {
      LIKE: 0, LOVE: 0, LAUGH: 0, FIRE: 0, WOW: 0, SAD: 0, ANGRY: 0, CARE: 0, CLAP: 0,
    };
    for (const reaction of post.reactions) {
      counts[reaction.type] = (counts[reaction.type] ?? 0) + 1;
    }

    const isLocked = Boolean(
      post.requiredTierId && post.authorId !== viewerId && !unlockedTierIds.has(post.requiredTierId),
    );

    return {
      id: post.id,
      type: post.type,
      content: isLocked ? null : post.content,
      images: isLocked ? [] : post.images,
      videoUrl: isLocked ? null : post.videoUrl,
      gifUrl: isLocked ? null : post.gifUrl,
      pollOptions: isLocked ? null : post.pollOptions,
      pollVotes: isLocked ? null : post.pollVotes,
      createdAt: post.createdAt,
      expiresAt: post.expiresAt,
      author: post.author,
      reactionCounts: counts,
      totalReactions: post.reactions.length,
      commentCount: post._count.comments,
      repostCount: post._count.reposts,
      viewerReaction: viewerReactionByPost.get(post.id) ?? null,
      viewerBookmarked: bookmarkedPosts.has(post.id),
      viewerReposted: repostedPosts.has(post.id),
      requiredTierId: post.requiredTierId,
      isLocked,
    };
  });
}

export type SerializedComment = Comment & {
  author: { id: string; username: string; name: string | null; image: string | null };
};
