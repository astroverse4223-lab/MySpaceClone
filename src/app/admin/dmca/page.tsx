"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/time";

interface DmcaRow {
  id: string;
  complainantName: string;
  complainantEmail: string;
  contentType: string;
  contentUrl: string;
  targetUsername: string | null;
  description: string;
  signature: string;
  status: string;
  createdAt: string;
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  PROFILE_SONG: "Profile song",
  PLAYLIST_TRACK: "Playlist track",
  POST: "Post",
  OTHER: "Other",
};

const AUTO_TAKEDOWN_TYPES = new Set(["PROFILE_SONG", "PLAYLIST_TRACK"]);

export default function AdminDmcaPage() {
  const [requests, setRequests] = useState<DmcaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string>();

  async function load() {
    const res = await fetch("/api/admin/dmca?status=PENDING");
    const json = await res.json();
    setRequests(json.requests ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(id: string, status: "RESOLVED" | "DISMISSED", takedown: boolean) {
    setWarning(undefined);
    const res = await fetch(`/api/admin/dmca/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, takedown }),
    });
    const json = await res.json();
    if (json.takedownWarning) setWarning(json.takedownWarning);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">DMCA / copyright requests</h1>
      <p className="mt-1 text-sm text-white/40">
        Takedown notices submitted via{" "}
        <a href="/dmca" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">
          /dmca
        </a>
        . &quot;Remove content &amp; resolve&quot; auto-deletes the matching profile song or playlist track when it
        can find one — otherwise pull the content manually from Content moderation.
      </p>

      {warning && (
        <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
          {warning}
        </p>
      )}

      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="text-sm text-white/40">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-white/40">No pending requests.</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm">
                <span className="font-medium">{CONTENT_TYPE_LABEL[req.contentType] ?? req.contentType}</span>
                {req.targetUsername && <span className="text-white/40"> · @{req.targetUsername}</span>}
              </p>
              <p className="mt-1 break-all text-xs text-violet-300">{req.contentUrl}</p>
              <p className="mt-2 text-sm text-white/70">{req.description}</p>
              <p className="mt-2 text-xs text-white/40">
                {req.complainantName} ({req.complainantEmail}) · signed &quot;{req.signature}&quot; ·{" "}
                {timeAgo(req.createdAt)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {AUTO_TAKEDOWN_TYPES.has(req.contentType) && (
                  <button
                    onClick={() => resolve(req.id, "RESOLVED", true)}
                    className="rounded-lg border border-red-500/40 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Remove content & resolve
                  </button>
                )}
                <button
                  onClick={() => resolve(req.id, "RESOLVED", false)}
                  className="rounded-lg border border-emerald-500/30 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10"
                >
                  Mark resolved
                </button>
                <button
                  onClick={() => resolve(req.id, "DISMISSED", false)}
                  className="rounded-lg border border-white/15 px-3 py-1 text-xs hover:bg-white/5"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
