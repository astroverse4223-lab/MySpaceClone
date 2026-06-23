"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/friends/user-avatar";
import { timeAgo } from "@/lib/time";
import type { ConversationSummary } from "@/components/messages/types";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; username: string; name: string | null; image: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((json) => {
        setConversations(json.conversations ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setResults(json.users ?? []);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  async function startConversation(username: string) {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const json = await res.json();
    if (res.ok) {
      window.location.href = `/messages/${json.conversationId}`;
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Messages</h1>

      <div className="mt-4">
        <input
          className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-violet-400/60"
          placeholder="Search people to message..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.length > 0 && (
          <ul className="mt-2 rounded-xl border border-white/10 bg-white/5">
            {results.map((user) => (
              <li key={user.id}>
                <button
                  onClick={() => startConversation(user.username)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-white/5"
                >
                  <UserAvatar name={user.name ?? user.username} image={user.image} size={28} />
                  <span className="text-sm">{user.name ?? user.username}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 space-y-1">
        {loading ? (
          <p className="text-sm text-white/40">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-white/40">No conversations yet. Search above to start one.</p>
        ) : (
          conversations.map((c) => {
            const title = c.isGroup ? c.name : c.participants[0]?.name ?? c.participants[0]?.username;
            return (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar name={title ?? "?"} image={c.participants[0]?.image} />
                  <div>
                    <p className={`text-sm ${c.unread ? "font-semibold" : "font-medium"}`}>{title}</p>
                    <p className="max-w-[220px] truncate text-xs text-white/50">
                      {c.lastMessage?.content ?? "No messages yet"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {c.lastMessage && <span className="text-[10px] text-white/30">{timeAgo(c.lastMessage.createdAt)}</span>}
                  {c.unread && <span className="h-2 w-2 rounded-full bg-violet-400" />}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
