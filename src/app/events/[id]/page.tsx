"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface RsvpRow {
  status: string;
  user: { id: string; username: string; name: string | null };
}

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  isOnline: boolean;
  location: string | null;
  onlineUrl: string | null;
  startsAt: string;
  createdBy: { username: string; name: string | null };
  rsvps: RsvpRow[];
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventDetail>();
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch(`/api/events/${id}`);
    const json = await res.json();
    setEvent(json.event);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function rsvp(status: string) {
    await fetch(`/api/events/${id}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (loading || !event) {
    return <p className="px-6 py-16 text-center text-white/60">Loading...</p>;
  }

  const myRsvp = event.rsvps.find((r) => r.user.id === session?.user?.id);
  const going = event.rsvps.filter((r) => r.status === "GOING");

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-sm text-violet-400">
        {new Date(event.startsAt).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
      </p>
      <h1 className="mt-1 text-2xl font-semibold">{event.title}</h1>
      <p className="mt-2 text-sm text-white/50">
        Hosted by{" "}
        <Link href={`/profile/${event.createdBy.username}`} className="hover:underline">
          {event.createdBy.name ?? event.createdBy.username}
        </Link>
      </p>
      <p className="mt-1 text-sm text-white/70">
        {event.isOnline ? (
          <a href={event.onlineUrl ?? "#"} className="text-violet-400 hover:underline">
            Join online
          </a>
        ) : (
          event.location
        )}
      </p>

      {event.description && <p className="mt-4 whitespace-pre-wrap text-white/90">{event.description}</p>}

      {session?.user && (
        <div className="mt-6 flex gap-2">
          {["GOING", "INTERESTED", "NOT_GOING"].map((status) => (
            <button
              key={status}
              onClick={() => rsvp(status)}
              className={`rounded-full px-4 py-1.5 text-sm ${
                myRsvp?.status === status ? "bg-violet-500" : "border border-white/15 hover:bg-white/5"
              }`}
            >
              {status === "GOING" ? "Going" : status === "INTERESTED" ? "Interested" : "Can't go"}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-medium text-white/50">{going.length} going</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {going.map((r) => (
            <Link
              key={r.user.id}
              href={`/profile/${r.user.username}`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm hover:bg-white/10"
            >
              {r.user.name ?? r.user.username}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
