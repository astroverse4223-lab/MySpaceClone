export interface PostAuthor {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
}

export interface SerializedPost {
  id: string;
  type: string;
  content: string | null;
  images: string[];
  videoUrl: string | null;
  gifUrl: string | null;
  pollOptions: string[] | null;
  pollVotes: { counts?: number[]; [key: string]: unknown } | null;
  createdAt: string;
  expiresAt?: string | null;
  author: PostAuthor;
  reactionCounts: Record<string, number>;
  totalReactions: number;
  commentCount: number;
  repostCount: number;
  viewerReaction: string | null;
  viewerBookmarked: boolean;
  viewerReposted: boolean;
  requiredTierId: string | null;
  isLocked: boolean;
}

export interface SerializedComment {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  author: PostAuthor;
  likeCount: number;
  reactionCounts?: Record<string, number>;
  viewerReaction?: string | null;
  viewerLiked: boolean;
}
