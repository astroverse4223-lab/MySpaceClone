"use client";

import { useState } from "react";

export default function AdminBroadcastPage() {
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string>();

  async function send() {
    if (!message.trim()) return;
    if (!confirm("Send this announcement to every user?")) return;
    setSending(true);
    setResult(undefined);
    const res = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, link: link || undefined }),
    });
    const json = await res.json();
    setSending(false);
    if (res.ok) {
      setResult(`✅ Sent to ${json.recipients} users.`);
      setMessage("");
      setLink("");
    } else {
      setResult(`❌ ${json.error ?? "Failed to send"}`);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Broadcast</h1>
      <p className="mt-1 text-sm text-white/40">
        Send a site-wide notification to every user. They&apos;ll see it in their notification bell.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <label className="block text-xs font-medium text-white/50">Message</label>
        <textarea
          className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
          rows={4}
          maxLength={500}
          placeholder="📢 Heads up — we just shipped a new feature!"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className="mt-1 text-right text-[10px] text-white/30">{message.length}/500</p>

        <label className="mt-3 block text-xs font-medium text-white/50">Link (optional)</label>
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
          placeholder="/reels"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />

        {result && <p className="mt-3 text-sm text-white/80">{result}</p>}

        <button
          onClick={send}
          disabled={sending || !message.trim()}
          className="mt-4 rounded-lg bg-violet-500 px-5 py-2 text-sm font-medium hover:bg-violet-400 disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send to everyone"}
        </button>
      </div>
    </div>
  );
}
