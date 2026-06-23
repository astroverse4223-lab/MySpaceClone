"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface EventSummary {
  id: string;
  title: string;
  isOnline: boolean;
  location: string | null;
  startsAt: string;
  createdBy: { username: string; name: string | null };
  _count: { rsvps: number };
}

export default function EventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((json) => {
        setEvents(json.events ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Events</h1>
        {session?.user && (
          <Link href="/events/new" className="rounded-full bg-violet-500 px-4 py-1.5 text-sm font-medium hover:bg-violet-400">
            Create event
          </Link>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-white/40">Loading...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-white/40">No upcoming events.</p>
        ) : (
          events.map((e) => (
            <Link
              key={e.id}
              href={`/events/${e.id}`}
              className="block rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
            >
              <p className="text-xs text-violet-400">
                {new Date(e.startsAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
              <h2 className="mt-1 font-medium">{e.title}</h2>
              <p className="mt-1 text-sm text-white/50">
                {e.isOnline ? "Online" : e.location} · {e._count.rsvps} going
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
