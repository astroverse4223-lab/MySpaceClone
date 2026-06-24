"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePlayer } from "@/lib/player-store";
import { getSocket } from "@/lib/socket-client";
import { useIsOnline } from "@/lib/presence-store";
import { uploadFile } from "@/lib/use-upload";
import { timeAgo } from "@/lib/time";
import type { ConversationSummary, ChatMessage, MessageUser, MessageReaction } from "@/components/messages/types";

const REACTION_EMOJIS = ["❤️", "😂", "👍", "🔥", "😮", "😢"];

function aggregateReactions(reactions?: MessageReaction[]): [string, number][] {
  if (!reactions?.length) return [];
  const counts = new Map<string, number>();
  for (const r of reactions) counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
  return [...counts.entries()];
}

function convName(c: ConversationSummary): string {
  if (c.isGroup) return c.name ?? "Group chat";
  const other = c.participants[0];
  return other?.name ?? other?.username ?? "Conversation";
}

function Avatar({ user, size = 36, showPresence = false }: { user?: MessageUser | null; size?: number; showPresence?: boolean }) {
  const online = useIsOnline(user?.id);
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <span
        className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-white/10 text-sm font-semibold"
      >
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-full w-full object-cover" />
        ) : (
          (user?.name ?? user?.username ?? "?")[0]?.toUpperCase()
        )}
      </span>
      {showPresence && online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0c0c14] bg-emerald-400" />
      )}
    </span>
  );
}

export function ChatWidget() {
  const { data: session, status } = useSession();
  const playerActive = usePlayer((s) => s.queue.length > 0);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MessageUser[]>([]);
  const [popup, setPopup] = useState<ConversationSummary | null>(null);
  const [sending, setSending] = useState(false);
  const [othersTyping, setOthersTyping] = useState(false);
  const [readByOthersAt, setReadByOthersAt] = useState<string | null>(null);
  const [reactOpenId, setReactOpenId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const lastSeenRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loggedIn = status === "authenticated" && Boolean(session?.user);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const json = await res.json();
      const convs: ConversationSummary[] = json.conversations ?? [];
      setConversations(convs);

      // Detect a brand-new incoming message for the popup bubble.
      const top = convs.find((c) => c.unread && c.lastMessage);
      if (top?.lastMessage) {
        const sig = `${top.id}:${top.lastMessage.createdAt}`;
        if (lastSeenRef.current && sig !== lastSeenRef.current && !open) {
          setPopup(top);
          window.setTimeout(() => setPopup((p) => (p?.id === top.id ? null : p)), 6000);
        }
        lastSeenRef.current = sig;
      }
    } catch {
      /* ignore */
    }
  }, [open]);

  useEffect(() => {
    if (!loggedIn) return;
    loadConversations();
    const interval = setInterval(loadConversations, 12_000);
    return () => clearInterval(interval);
  }, [loggedIn, loadConversations]);

  const loadMessages = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (!res.ok) return;
      const json = await res.json();
      setMessages(json.messages ?? []);
      setReadByOthersAt(json.readByOthersAt ?? null);
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
    } catch {
      /* ignore */
    }
  }, []);

  // Poll the open chat as a fallback for new messages.
  useEffect(() => {
    if (view !== "chat" || !activeId) return;
    loadMessages(activeId);
    const interval = setInterval(() => loadMessages(activeId), 10_000);
    return () => clearInterval(interval);
  }, [view, activeId, loadMessages]);

  // Real-time: instant messages + typing for the open chat.
  useEffect(() => {
    if (!loggedIn || view !== "chat" || !activeId) return;
    const socket = getSocket();
    socket.emit("conversation:join", activeId);

    const onMsg = (m: ChatMessage) => {
      if (m.conversationId !== activeId) return;
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      setOthersTyping(false);
      if (m.senderId !== session?.user.id) {
        fetch(`/api/conversations/${activeId}/read`, { method: "POST" }).catch(() => {});
      }
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
    };
    const onTyping = ({ conversationId, userId, isTyping }: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (conversationId !== activeId || userId === session?.user.id) return;
      setOthersTyping(isTyping);
    };

    const onReaction = ({ messageId, reactions }: { messageId: string; reactions: MessageReaction[] }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
    };

    socket.on("message:new", onMsg);
    socket.on("typing", onTyping);
    socket.on("message:reaction", onReaction);
    return () => {
      socket.emit("conversation:leave", activeId);
      socket.off("message:new", onMsg);
      socket.off("typing", onTyping);
      socket.off("message:reaction", onReaction);
      setOthersTyping(false);
    };
  }, [loggedIn, view, activeId, session?.user.id]);

  async function react(messageId: string, emoji: string) {
    setReactOpenId(null);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const mine = session?.user.id;
        const others = (m.reactions ?? []).filter((r) => r.userId !== mine);
        const had = (m.reactions ?? []).find((r) => r.userId === mine);
        const next = had && had.emoji === emoji ? others : [...others, { userId: mine!, emoji }];
        return { ...m, reactions: next };
      }),
    );
    await fetch(`/api/messages/${messageId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    }).catch(() => {});
  }

  async function sendImage(file: File) {
    if (!activeId) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentUrl: url, attachmentType: "IMAGE" }),
      });
      const json = await res.json();
      if (res.ok && json.message) {
        setMessages((prev) => (prev.some((x) => x.id === json.message.id) ? prev : [...prev, json.message]));
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        });
      }
    } catch {
      /* ignore */
    }
    setUploading(false);
  }

  function emitTyping() {
    if (!activeId) return;
    const socket = getSocket();
    socket.emit("typing", { conversationId: activeId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { conversationId: activeId, isTyping: false });
    }, 1500);
  }

  // Debounced user search.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        setResults(json.users ?? []);
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  async function openConversation(c: ConversationSummary) {
    setActiveId(c.id);
    setActiveConv(c);
    setView("chat");
    setPopup(null);
    fetch(`/api/conversations/${c.id}/read`, { method: "POST" }).catch(() => {});
    setConversations((prev) => prev.map((x) => (x.id === c.id ? { ...x, unread: false } : x)));
  }

  async function startWith(user: MessageUser) {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username }),
      });
      const json = await res.json();
      if (!res.ok) return;
      setQuery("");
      setResults([]);
      const stub: ConversationSummary = {
        id: json.conversationId,
        isGroup: false,
        name: null,
        participants: [user],
        lastMessage: null,
        unread: false,
        updatedAt: new Date().toISOString(),
      };
      await openConversation(stub);
      loadConversations();
    } catch {
      /* ignore */
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !activeId || sending) return;
    setSending(true);
    const body = text;
    setText("");
    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: body }),
      });
      const json = await res.json();
      if (res.ok && json.message) {
        setMessages((prev) => [...prev, json.message]);
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        });
      }
    } catch {
      /* ignore */
    }
    setSending(false);
  }

  if (!loggedIn) return null;

  const unreadCount = conversations.filter((c) => c.unread).length;
  const bottomOffset = playerActive ? "bottom-24" : "safe-bottom-offset";

  return (
    <div className={`fixed right-4 z-50 sm:right-6 ${bottomOffset}`}>
      {/* New-message popup */}
      {popup && !open && (
        <button
          onClick={() => {
            setOpen(true);
            openConversation(popup);
          }}
          className="animate-pop-in mb-3 flex w-72 items-center gap-3 rounded-2xl border border-white/10 bg-[#0c0c14]/95 p-3 text-left shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          <Avatar user={popup.participants[0]} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{convName(popup)}</p>
            <p className="truncate text-xs text-white/50">{popup.lastMessage?.content ?? "New message"}</p>
          </div>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="mb-3 flex h-[460px] w-80 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c14]/95 shadow-2xl shadow-black/50 backdrop-blur-xl sm:w-96">
          {view === "list" ? (
            <>
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="text-sm font-semibold text-white">Messages</span>
                <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white" aria-label="Close">
                  ✕
                </button>
              </div>
              <div className="border-b border-white/10 p-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search people to start a chat…"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {results.length > 0 ? (
                  results.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => startWith(u)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/5"
                    >
                      <Avatar user={u} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{u.name ?? u.username}</p>
                        <p className="truncate text-xs text-white/40">@{u.username}</p>
                      </div>
                    </button>
                  ))
                ) : conversations.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-white/40">
                    No chats yet. Search for someone to start one! 💬
                  </p>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => openConversation(c)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/5"
                    >
                      <Avatar user={c.participants[0]} showPresence />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-white">{convName(c)}</p>
                          {c.lastMessage && (
                            <span className="shrink-0 text-[10px] text-white/30">{timeAgo(c.lastMessage.createdAt)}</span>
                          )}
                        </div>
                        <p className={`truncate text-xs ${c.unread ? "font-medium text-white/80" : "text-white/40"}`}>
                          {c.lastMessage?.content ?? "No messages yet"}
                        </p>
                      </div>
                      {c.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-pink-500" />}
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-3">
                <button onClick={() => setView("list")} className="text-white/60 hover:text-white" aria-label="Back">
                  ←
                </button>
                <Avatar user={activeConv?.participants[0]} size={28} showPresence />
                <span className="flex-1 truncate text-sm font-semibold text-white">
                  {activeConv ? convName(activeConv) : "Chat"}
                </span>
                <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white" aria-label="Close">
                  ✕
                </button>
              </div>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-xs text-white/40">Say hi 👋</p>
                ) : (
                  messages.map((m, idx) => {
                    const mine = m.senderId === session!.user.id;
                    const agg = aggregateReactions(m.reactions);
                    const isLastMine = mine && idx === messages.length - 1;
                    const seen =
                      isLastMine && readByOthersAt && new Date(m.createdAt) <= new Date(readByOthersAt);
                    return (
                      <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                        <div className={`flex items-center gap-1 ${mine ? "flex-row-reverse" : ""}`}>
                          <div
                            className={`max-w-[75%] overflow-hidden rounded-2xl text-sm ${
                              mine ? "gradient-accent text-white" : "bg-white/10 text-white/90"
                            }`}
                          >
                            {m.attachmentUrl && m.attachmentType === "IMAGE" && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.attachmentUrl} alt="" className="max-h-48 w-full object-cover" />
                            )}
                            {m.content && <p className="px-3 py-2">{m.content}</p>}
                          </div>
                          <button
                            onClick={() => setReactOpenId((id) => (id === m.id ? null : m.id))}
                            className="text-xs text-white/30 transition hover:text-white/70"
                            aria-label="React"
                          >
                            ☺
                          </button>
                        </div>

                        {reactOpenId === m.id && (
                          <div className="mt-1 flex gap-1 rounded-full border border-white/10 bg-[#15151f] px-2 py-1">
                            {REACTION_EMOJIS.map((e) => (
                              <button key={e} onClick={() => react(m.id, e)} className="text-base transition hover:scale-125">
                                {e}
                              </button>
                            ))}
                          </div>
                        )}

                        {agg.length > 0 && (
                          <div className={`mt-1 flex gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                            {agg.map(([emoji, count]) => (
                              <button
                                key={emoji}
                                onClick={() => react(m.id, emoji)}
                                className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs"
                              >
                                {emoji} {count > 1 && count}
                              </button>
                            ))}
                          </div>
                        )}

                        {seen && <span className="mt-0.5 pr-1 text-[10px] text-white/40">Seen ✓✓</span>}
                      </div>
                    );
                  })
                )}
              </div>
              {othersTyping && (
                <div className="px-4 pb-1 text-xs italic text-white/50">typing…</div>
              )}
              <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 p-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && sendImage(e.target.files[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                  aria-label="Send image"
                  title="Send image"
                >
                  {uploading ? "…" : "📷"}
                </button>
                <input
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    emitTyping();
                  }}
                  placeholder="Message…"
                  className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="gradient-accent grid h-9 w-9 shrink-0 place-items-center rounded-full text-white disabled:opacity-40"
                  aria-label="Send"
                >
                  ➤
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) {
            setView("list");
            loadConversations();
          }
        }}
        className="gradient-accent relative ml-auto grid h-14 w-14 place-items-center rounded-full text-2xl text-white shadow-2xl shadow-black/40 transition hover:scale-105"
        aria-label="Open chat"
      >
        {open ? "✕" : "💬"}
        {!open && unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-h-[20px] min-w-[20px] place-items-center rounded-full bg-pink-500 px-1 text-xs font-bold text-white ring-2 ring-[#0a0a0f]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
