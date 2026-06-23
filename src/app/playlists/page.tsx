"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePlayer, type Track as PlayerTrack } from "@/lib/player-store";

interface Track {
  id: string;
  title: string;
  artist: string;
  externalUrl: string | null;
}

interface PlaylistRow {
  id: string;
  name: string;
  description: string | null;
  tracks: Track[];
}

export default function PlaylistsPage() {
  const { data: session } = useSession();
  const playQueue = usePlayer((s) => s.playQueue);
  const playTrack = usePlayer((s) => s.playTrack);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [trackDrafts, setTrackDrafts] = useState<Record<string, { title: string; artist: string; url: string }>>({});

  async function load() {
    if (!session?.user) return;
    const res = await fetch(`/api/playlists?userId=${session.user.id}`);
    const json = await res.json();
    setPlaylists(json.playlists ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  async function createPlaylist() {
    if (!name.trim()) return;
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setName("");
      load();
    }
  }

  async function deletePlaylist(id: string) {
    await fetch(`/api/playlists/${id}`, { method: "DELETE" });
    load();
  }

  async function addTrack(playlistId: string) {
    const draft = trackDrafts[playlistId];
    if (!draft?.title || !draft?.artist) return;
    await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: draft.title, artist: draft.artist, externalUrl: draft.url || undefined }),
    });
    setTrackDrafts((d) => ({ ...d, [playlistId]: { title: "", artist: "", url: "" } }));
    load();
  }

  async function removeTrack(playlistId: string, trackId: string) {
    await fetch(`/api/playlists/${playlistId}/tracks/${trackId}`, { method: "DELETE" });
    load();
  }

  function toPlayerTracks(tracks: Track[]): PlayerTrack[] {
    return tracks
      .filter((t) => t.externalUrl)
      .map((t) => ({ id: t.id, url: t.externalUrl as string, title: t.title, subtitle: t.artist }));
  }

  if (loading) {
    return <p className="px-6 py-16 text-center text-white/60">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Your playlists</h1>

      <div className="mt-6 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
          placeholder="New playlist name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={createPlaylist} className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium hover:bg-violet-400">
          Create
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {playlists.map((playlist) => {
          const draft = trackDrafts[playlist.id] ?? { title: "", artist: "", url: "" };
          return (
            <div key={playlist.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{playlist.name}</h2>
                <div className="flex items-center gap-3">
                  {toPlayerTracks(playlist.tracks).length > 0 && (
                    <button
                      onClick={() => playQueue(toPlayerTracks(playlist.tracks))}
                      className="gradient-accent rounded-full px-3 py-1 text-xs font-medium text-white"
                    >
                      ▶ Play all
                    </button>
                  )}
                  <button onClick={() => deletePlaylist(playlist.id)} className="text-xs text-white/40 hover:text-red-300">
                    Delete
                  </button>
                </div>
              </div>

              <ul className="mt-3 space-y-1">
                {playlist.tracks.map((track) => (
                  <li key={track.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {track.externalUrl && (
                        <button
                          onClick={() =>
                            playTrack({ id: track.id, url: track.externalUrl as string, title: track.title, subtitle: track.artist })
                          }
                          className="text-white/50 transition hover:text-[var(--site-accent)]"
                          aria-label={`Play ${track.title}`}
                        >
                          ▶
                        </button>
                      )}
                      {track.title} — <span className="text-white/50">{track.artist}</span>
                    </span>
                    <button
                      onClick={() => removeTrack(playlist.id, track.id)}
                      className="text-xs text-white/30 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </li>
                ))}
                {playlist.tracks.length === 0 && <p className="text-sm text-white/30">No tracks yet.</p>}
              </ul>

              <div className="mt-3 flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs outline-none focus:border-violet-400/60"
                  placeholder="Title"
                  value={draft.title}
                  onChange={(e) =>
                    setTrackDrafts((d) => ({ ...d, [playlist.id]: { ...draft, title: e.target.value } }))
                  }
                />
                <input
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs outline-none focus:border-violet-400/60"
                  placeholder="Artist"
                  value={draft.artist}
                  onChange={(e) =>
                    setTrackDrafts((d) => ({ ...d, [playlist.id]: { ...draft, artist: e.target.value } }))
                  }
                />
                <button
                  onClick={() => addTrack(playlist.id)}
                  className="rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-medium hover:bg-violet-400"
                >
                  Add
                </button>
              </div>
            </div>
          );
        })}
        {playlists.length === 0 && <p className="text-sm text-white/40">No playlists yet.</p>}
      </div>
    </div>
  );
}
