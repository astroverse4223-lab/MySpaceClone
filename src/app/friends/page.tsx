"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/friends/user-avatar";

interface FriendUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  friendshipId?: string;
}

interface FriendshipWithUsers {
  id: string;
  status: string;
  requester: FriendUser;
  addressee: FriendUser;
}

export default function FriendsPage() {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<FriendshipWithUsers[]>([]);
  const [outgoing, setOutgoing] = useState<FriendshipWithUsers[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendUser[]>([]);
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(true);

  const loadFriends = useCallback(async () => {
    const res = await fetch("/api/friends");
    const json = await res.json();
    setFriends(json.friends ?? []);
    setIncoming(json.incoming ?? []);
    setOutgoing(json.outgoing ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

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

  async function sendRequest(username: string) {
    setMessage(undefined);
    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error);
      return;
    }
    setMessage(`Friend request sent to @${username}`);
    setQuery("");
    setResults([]);
    loadFriends();
  }

  async function respond(id: string, action: "accept" | "decline") {
    await fetch(`/api/friends/${id}/${action}`, { method: "POST" });
    loadFriends();
  }

  async function removeFriendship(id: string) {
    await fetch(`/api/friends/${id}`, { method: "DELETE" });
    loadFriends();
  }

  if (loading) {
    return <p className="px-6 py-16 text-center text-white/60">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Friends</h1>
        <Link href="/friends/top-friends" className="text-sm text-violet-400 hover:underline">
          Manage Top Friends
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <input
          className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-violet-400/60"
          placeholder="Search by username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {message && <p className="mt-2 text-sm text-white/60">{message}</p>}
        {results.length > 0 && (
          <ul className="mt-3 space-y-2">
            {results.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserAvatar name={user.name ?? user.username} image={user.image} size={32} />
                  <div>
                    <p className="text-sm font-medium">{user.name ?? user.username}</p>
                    <p className="text-xs text-white/50">@{user.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => sendRequest(user.username)}
                  className="rounded-full bg-violet-500 px-3 py-1 text-xs font-medium hover:bg-violet-400"
                >
                  Add friend
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {incoming.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-white/50">Friend requests</h2>
          <ul className="mt-3 space-y-2">
            {incoming.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar name={f.requester.name ?? f.requester.username} image={f.requester.image} />
                  <div>
                    <p className="text-sm font-medium">{f.requester.name ?? f.requester.username}</p>
                    <p className="text-xs text-white/50">@{f.requester.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(f.id, "accept")}
                    className="rounded-full bg-violet-500 px-3 py-1 text-xs font-medium hover:bg-violet-400"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respond(f.id, "decline")}
                    className="rounded-full border border-white/15 px-3 py-1 text-xs hover:bg-white/5"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-white/50">Sent requests</h2>
          <ul className="mt-3 space-y-2">
            {outgoing.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar name={f.addressee.name ?? f.addressee.username} image={f.addressee.image} />
                  <p className="text-sm">@{f.addressee.username}</p>
                </div>
                <button
                  onClick={() => removeFriendship(f.id)}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs hover:bg-white/5"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-medium text-white/50">
          Friends {session?.user ? `(${friends.length})` : ""}
        </h2>
        {friends.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">No friends yet. Search above to add some.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {friends.map((friend) => (
              <li
                key={friend.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <Link href={`/profile/${friend.username}`} className="flex items-center gap-3">
                  <UserAvatar name={friend.name ?? friend.username} image={friend.image} />
                  <div>
                    <p className="text-sm font-medium">{friend.name ?? friend.username}</p>
                    <p className="text-xs text-white/50">@{friend.username}</p>
                  </div>
                </Link>
                <button
                  onClick={() => friend.friendshipId && removeFriendship(friend.friendshipId)}
                  className="text-xs text-white/40 hover:text-red-300"
                >
                  Unfriend
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
