"use client";

import { useEffect, useState } from "react";

type BulletinType = "FEATURE" | "MAINTENANCE" | "UPDATE" | "GENERAL";

type Bulletin = {
  id: string;
  title: string;
  body: string;
  type: BulletinType;
  link: string | null;
  pinned: boolean;
  createdAt: string;
  author: { username: string; name: string | null };
};

const TYPE_META: Record<BulletinType, { label: string; emoji: string; classes: string }> = {
  FEATURE: { label: "New feature", emoji: "✨", classes: "border-violet-400/40 bg-violet-500/10" },
  MAINTENANCE: { label: "Maintenance", emoji: "🛠️", classes: "border-amber-400/40 bg-amber-500/10" },
  UPDATE: { label: "Update", emoji: "📢", classes: "border-sky-400/40 bg-sky-500/10" },
  GENERAL: { label: "Announcement", emoji: "💬", classes: "border-white/20 bg-white/5" },
};

export default function AdminBroadcastPage() {
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<BulletinType>("UPDATE");
  const [link, setLink] = useState("");
  const [pinned, setPinned] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string>();

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/bulletins");
    if (res.ok) {
      const json = await res.json();
      setBulletins(json.bulletins);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function send() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setResult(undefined);
    const res = await fetch("/api/admin/bulletins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, type, link: link || undefined, pinned }),
    });
    const json = await res.json();
    setSending(false);
    if (res.ok) {
      setResult(`✅ Posted and notified ${json.recipients} users.`);
      setTitle("");
      setBody("");
      setLink("");
      load();
    } else {
      setResult(`❌ ${json.error ?? "Failed to send"}`);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this broadcast from the feed?")) return;
    await fetch(`/api/admin/bulletins/${id}`, { method: "DELETE" });
    setBulletins((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Broadcast</h1>
      <p className="mt-1 text-sm text-white/40">
        Post an announcement that appears as a banner above everyone&apos;s feed and pings their notification
        bell. Remove it any time to take it down.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <label className="block text-xs font-medium text-white/50">Type</label>
        <div className="mt-1 flex gap-2">
          {(Object.keys(TYPE_META) as BulletinType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                type === t ? TYPE_META[t].classes : "border-white/10 text-white/50 hover:bg-white/5"
              }`}
            >
              {TYPE_META[t].emoji} {TYPE_META[t].label}
            </button>
          ))}
        </div>

        <label className="mt-3 block text-xs font-medium text-white/50">Title</label>
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
          maxLength={120}
          placeholder="We just shipped Reels 2.0!"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="mt-3 block text-xs font-medium text-white/50">Message</label>
        <textarea
          className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
          rows={4}
          maxLength={1000}
          placeholder="Details about what's new, what's down, or what's coming…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <p className="mt-1 text-right text-[10px] text-white/30">{body.length}/1000</p>

        <label className="mt-3 block text-xs font-medium text-white/50">Link (optional)</label>
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
          placeholder="/reels"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />

        <label className="mt-3 flex items-center gap-2 text-xs text-white/60">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          Pin to the top of the banner stack
        </label>

        {result && <p className="mt-3 text-sm text-white/80">{result}</p>}

        <button
          onClick={send}
          disabled={sending || !title.trim() || !body.trim()}
          className="mt-4 rounded-lg bg-violet-500 px-5 py-2 text-sm font-medium hover:bg-violet-400 disabled:opacity-50"
        >
          {sending ? "Posting..." : "Post broadcast"}
        </button>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-white/70">Active broadcasts</h2>
      <div className="mt-3 space-y-2">
        {loading && <p className="text-xs text-white/40">Loading…</p>}
        {!loading && bulletins.length === 0 && (
          <p className="text-xs text-white/40">Nothing live right now.</p>
        )}
        {bulletins.map((b) => {
          const meta = TYPE_META[b.type];
          return (
            <div key={b.id} className={`rounded-xl border p-3 ${meta.classes}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {meta.emoji} {b.title} {b.pinned && <span className="ml-1 text-[10px] text-white/40">PINNED</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-white/60">{b.body}</p>
                </div>
                <button
                  onClick={() => remove(b.id)}
                  className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-[10px] text-white/60 hover:bg-white/10 hover:text-white"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
