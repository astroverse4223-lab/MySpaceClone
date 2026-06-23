"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const input = "w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-violet-400/60";

  async function create() {
    setSaving(true);
    setError(undefined);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined,
        isOnline,
        location: !isOnline ? location || undefined : undefined,
        onlineUrl: isOnline ? onlineUrl || undefined : undefined,
        startsAt: new Date(startsAt).toISOString(),
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error);
      return;
    }
    router.push(`/events/${json.event.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Create an event</h1>

      <div className="mt-6 space-y-4">
        {error && <p className="text-sm text-red-300">{error}</p>}
        <input className={input} placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          className={input}
          rows={3}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="datetime-local"
          className={input}
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />

        <div className="flex gap-2">
          <button
            onClick={() => setIsOnline(false)}
            className={`rounded-full px-3 py-1 text-xs ${!isOnline ? "bg-violet-500" : "border border-white/15"}`}
          >
            In person
          </button>
          <button
            onClick={() => setIsOnline(true)}
            className={`rounded-full px-3 py-1 text-xs ${isOnline ? "bg-violet-500" : "border border-white/15"}`}
          >
            Online
          </button>
        </div>

        {isOnline ? (
          <input
            className={input}
            placeholder="Online link (Zoom, Discord, etc.)"
            value={onlineUrl}
            onChange={(e) => setOnlineUrl(e.target.value)}
          />
        ) : (
          <input className={input} placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        )}

        <button
          onClick={create}
          disabled={saving || !title || !startsAt}
          className="w-full rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium hover:bg-violet-400 disabled:opacity-50"
        >
          Create event
        </button>
      </div>
    </div>
  );
}
