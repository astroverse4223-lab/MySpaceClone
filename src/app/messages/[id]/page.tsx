"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getSocket } from "@/lib/socket-client";
import { timeAgo } from "@/lib/time";
import type { ChatMessage } from "@/components/messages/types";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
        setLoading(false);
      });
    fetch(`/api/conversations/${id}/read`, { method: "POST" });
  }, [id]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("conversation:join", id);

    function onMessage(message: ChatMessage) {
      if (message.conversationId === id) {
        setMessages((prev) => [...prev, message]);
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

    socket.on("message:new", onMessage);
    socket.on("typing", onTyping);

    return () => {
      socket.emit("conversation:leave", id);
      socket.off("message:new", onMessage);
      socket.off("typing", onTyping);
    };
  }, [id, session?.user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: body }),
    });
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-72px)] max-w-xl flex-col px-6 py-6">
      <Link href="/messages" className="text-sm text-white/50 hover:text-white">
        ← Back to messages
      </Link>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-white/40">Loading...</p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === session?.user?.id;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
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
