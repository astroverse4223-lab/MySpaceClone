"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/time";

type Entry = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
    profile: { avatarImage: string | null; displayName: string | null } | null;
  };
};

export function Guestbook({
  username,
  viewerId,
  isOwner,
  accent,
}: {
  username: string;
  viewerId: string | null;
  isOwner: boolean;
  accent: string;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/profile/${username}/guestbook`)
      .then((r) => r.json())
      .then((j) => setEntries(j.entries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/profile/${username}/guestbook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
    } else {
      setEntries((prev) => [json.entry, ...prev]);
      setContent("");
    }
    setSubmitting(false);
  }

  async function remove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/guestbook/${id}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-white/50">
          📖 Guestbook
          {entries.length > 0 && <span className="text-white/30">({entries.length})</span>}
        </h2>
      </div>

      {viewerId && !isOwner && (
        <form onSubmit={submit} className="mt-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder={`Leave a note on ${username}'s page…`}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            {error ? (
              <span className="text-xs text-pink-400">{error}</span>
            ) : (
              <span className="text-xs text-white/30">{content.length}/500</span>
            )}
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-white transition disabled:opacity-40"
              style={{ backgroundColor: accent }}
            >
              {submitting ? "Signing…" : "Sign guestbook"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-white/30">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-white/40">
            No signatures yet.{" "}
            {viewerId && !isOwner ? "Be the first to say hi! 👋" : "Share your page to get some love."}
          </p>
        ) : (
          entries.map((entry) => {
            const avatar = entry.author.profile?.avatarImage ?? entry.author.image;
            const name = entry.author.profile?.displayName ?? entry.author.name ?? entry.author.username;
            const canDelete = isOwner || entry.author.id === viewerId;
            return (
              <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-start gap-3">
                  <Link
                    href={`/profile/${entry.author.username}`}
                    className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-sm font-semibold"
                  >
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      name[0]?.toUpperCase()
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${entry.author.username}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {name}
                      </Link>
                      <span className="text-xs text-white/30">{timeAgo(entry.createdAt)}</span>
                      {canDelete && (
                        <button
                          onClick={() => remove(entry.id)}
                          className="ml-auto text-xs text-white/30 transition hover:text-pink-400"
                        >
                          remove
                        </button>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-white/85">{entry.content}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
