export interface StoryAuthor {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
}

export interface StoryItem {
  id: string;
  type: "PHOTO" | "VIDEO" | "MUSIC" | "POLL" | "QUESTION";
  mediaUrl: string | null;
  content: string | null;
  pollOptions: string[] | null;
  pollVotes: { counts?: number[]; [key: string]: unknown } | null;
  question: string | null;
  createdAt: string;
  expiresAt: string;
  seen: boolean;
  viewCount?: number;
}

export interface StoryGroup {
  author: StoryAuthor;
  hasUnseen: boolean;
  stories: StoryItem[];
}
