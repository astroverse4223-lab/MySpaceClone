"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getSocket } from "@/lib/socket-client";
import { timeAgo } from "@/lib/time";
import { UserAvatar } from "@/components/friends/user-avatar";
import { OnlineDot } from "@/components/realtime/online-dot";
import { PresenceIndicator } from "@/components/realtime/presence-indicator";
import type { ChatMessage } from "@/components/messages/types";

type Participant = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  lastSeenAt: string | null;
};

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [readByOthersAt, setReadByOthersAt] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/conversations/${id}/messages`)
      .then((res) => res.json())
      .then((json) => {
        setMessages(json.messages ?? []);
        setParticipants(json.participants ?? []);
        setReadByOthersAt(json.readByOthersAt ?? null);
        setLoading(false);
      });
    fetch(`/api/conversations/${id}/read`, { method: "POST" });
  }, [id]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("conversation:join", id);

    function onMessage(message: ChatMessage) {
      if (message.conversationId === id) {
        // Dedupe: the sender already appended this optimistically on send.
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
        fetch(`/api/conversations/${id}/read`, { method: "POST" });
      }
    }

    function onTyping({
      conversationId,
      userId,
      isTyping,
    }: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) {
      if (conversationId !== id || userId === session?.user?.id) return;
      setTypingUser(isTyping ? userId : null);
    }

    function onRead({
      conversationId,
      userId,
      readAt,
    }: {
      conversationId: string;
      userId: string;
      readAt: string;
    }) {
      if (conversationId !== id || userId === session?.user?.id) return;
      setReadByOthersAt((prev) => (!prev || readAt > prev ? readAt : prev));
    }

    socket.on("message:new", onMessage);
    socket.on("typing", onTyping);
    socket.on("conversation:read", onRead);

    return () => {
      socket.emit("conversation:leave", id);
      socket.off("message:new", onMessage);
      socket.off("typing", onTyping);
      socket.off("conversation:read", onRead);
    };
  }, [id, session?.user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 1:1 conversations have exactly one "other" participant to show in the header.
  const other = participants[0] ?? null;

  // Index of my last sent message — read receipt only renders under it.
  const lastMineIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderId === session?.user?.id) return i;
    }
    return -1;
  }, [messages, session?.user?.id]);

  const lastMineSeen =
    lastMineIndex >= 0 &&
    readByOthersAt != null &&
    new Date(readByOthersAt) >= new Date(messages[lastMineIndex].createdAt);

  function handleTyping(value: string) {
    setContent(value);
    const socket = getSocket();
    socket.emit("typing", { conversationId: id, isTyping: true });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing", { conversationId: id, isTyping: false });
    }, 1500);
  }

  async function send() {
    if (!content.trim()) return;
    const body = content;
    setContent("");
    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: body }),
    });
    if (res.ok) {
      // Show our own message immediately instead of waiting for the socket echo,
      // which may be delayed or dropped (e.g. multi-instance hosting). The
      // socket handler dedupes by id, so an echo won't double it up.
      const { message } = await res.json();
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-72px)] max-w-xl flex-col px-6 py-6">
      <Link href="/messages" className="text-sm text-white/50 hover:text-white">
        ← Back to messages
      </Link>

      {other && (
        <div className="mt-3 flex items-center gap-3 border-b border-white/10 pb-3">
          <div className="relative">
            <UserAvatar name={other.name ?? other.username} image={other.image} size={40} />
            <OnlineDot userId={other.id} className="absolute bottom-0 right-0 h-3 w-3" />
          </div>
          <div>
            <Link href={`/profile/${other.username}`} className="text-sm font-semibold hover:underline">
              {other.name ?? other.username}
            </Link>
            <PresenceIndicator userId={other.id} initialLastSeen={other.lastSeenAt} />
          </div>
        </div>
      )}

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-white/40">Loading...</p>
        ) : (
          messages.map((m, i) => {
            const isMine = m.senderId === session?.user?.id;
            return (
              <div key={m.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                    isMine ? "bg-violet-500 text-white" : "bg-white/10 text-white/90"
                  }`}
                >
                  {m.attachmentUrl && m.attachmentType === "IMAGE" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.attachmentUrl} alt="" className="mb-1.5 max-h-48 w-full rounded-lg object-cover" />
                  )}
                  {m.content}
                  <p className="mt-1 text-[10px] opacity-60">{timeAgo(m.createdAt)}</p>
                </div>
                {isMine && i === lastMineIndex && lastMineSeen && (
                  <span className="mt-0.5 pr-1 text-[10px] text-white/40">
                    Seen {readByOthersAt ? timeAgo(readByOthersAt) : ""}
                  </span>
                )}
              </div>
            );
          })
        )}
        {typingUser && <p className="text-xs text-white/40">Typing...</p>}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-full border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-violet-400/60"
          placeholder="Type a message..."
          value={content}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          className="rounded-full bg-violet-500 px-5 py-2.5 text-sm font-medium hover:bg-violet-400"
        >
          Send
        </button>
      </div>
    </div>
  );
}
