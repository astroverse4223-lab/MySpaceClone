export interface MessageUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
}

export interface ConversationSummary {
  id: string;
  isGroup: boolean;
  name: string | null;
  participants: MessageUser[];
  lastMessage: { content: string | null; createdAt: string } | null;
  unread: boolean;
  updatedAt: string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  createdAt: string;
  sender: MessageUser;
  reactions?: MessageReaction[];
}
