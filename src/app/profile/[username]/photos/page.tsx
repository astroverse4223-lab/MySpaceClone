"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { uploadFile } from "@/lib/use-upload";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  albumId: string | null;
}
interface Album {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  photos: Photo[];
}

export default function PhotosPage() {
  const { username } = useParams<{ username: string }>();
  const { data: session } = useSession();
  const isOwner = session?.user?.username === username;

  const [albums, setAlbums] = useState<Album[]>([]);
  const [loose, setLoose] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [uploadTarget, setUploadTarget] = useState<string | "loose">("loose");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/albums?username=${encodeURIComponent(username)}`);
    const json = await res.json();
    setAlbums(json.albums ?? []);
    setLoose(json.loosePhotos ?? []);
    setLoading(false);
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  async function createAlbum() {
    if (!newAlbumName.trim()) return;
    const res = await fetch("/api/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAlbumName }),
    });
    if (res.ok) {
      setNewAlbumName("");
      load();
    }
  }

  function pickFor(target: string | "loose") {
    setUploadTarget(target);
    fileRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, albumId: uploadTarget === "loose" ? undefined : uploadTarget }),
      });
      await load();
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(id: string) {
    if (!confirm("Delete this photo?")) return;
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    setLightbox(null);
    load();
  }

  async function deleteAlbum(id: string) {
    if (!confirm("Delete this album? Photos inside will move to Uncategorized.")) return;
    await fetch(`/api/albums/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <p className="px-6 py-16 text-center text-white/60">Loading photos...</p>;

  const totalPhotos = loose.length + albums.reduce((n, a) => n + a.photos.length, 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/profile/${username}`} className="text-sm text-white/50 hover:text-white">
            ← @{username}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">📷 Photos</h1>
          <p className="text-sm text-white/40">{totalPhotos} photos</p>
        </div>
        {isOwner && (
          <button
            onClick={() => pickFor("loose")}
            disabled={uploading}
            className="rounded-full bg-violet-500 px-4 py-2 text-sm font-medium hover:bg-violet-400 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "+ Upload photo"}
          </button>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

      {isOwner && (
        <div className="mt-6 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
            placeholder="New album name..."
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createAlbum()}
          />
          <button onClick={createAlbum} className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
            Create album
          </button>
        </div>
      )}

      {totalPhotos === 0 && !isOwner && (
        <p className="mt-12 text-center text-sm text-white/40">No photos yet.</p>
      )}

      {/* Albums */}
      {albums.map((album) => (
        <section key={album.id} className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">{album.name}</h2>
              {album.description && <p className="text-xs text-white/40">{album.description}</p>}
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={() => pickFor(album.id)}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs hover:bg-white/5"
                >
                  + Add
                </button>
                <button
                  onClick={() => deleteAlbum(album.id)}
                  className="rounded-full border border-red-500/30 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          <PhotoGrid photos={album.photos} onOpen={setLightbox} emptyLabel="No photos in this album yet." />
        </section>
      ))}

      {/* Uncategorized */}
      {loose.length > 0 && (
        <section className="mt-8">
          <h2 className="font-medium text-white/70">{albums.length > 0 ? "Uncategorized" : "All photos"}</h2>
          <PhotoGrid photos={loose} onOpen={setLightbox} />
        </section>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setLightbox(null)}>
          <div className="max-h-[90vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.url} alt={lightbox.caption ?? "Photo"} className="max-h-[80vh] rounded-lg" />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-white/70">{lightbox.caption}</p>
              {isOwner && (
                <button onClick={() => deletePhoto(lightbox.id)} className="text-xs text-red-300 hover:underline">
                  Delete photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoGrid({
  photos,
  onOpen,
  emptyLabel,
}: {
  photos: Photo[];
  onOpen: (p: Photo) => void;
  emptyLabel?: string;
}) {
  if (photos.length === 0) {
    return emptyLabel ? <p className="mt-3 text-sm text-white/30">{emptyLabel}</p> : null;
  }
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((photo) => (
        <button
          key={photo.id}
          onClick={() => onOpen(photo)}
          className="aspect-square overflow-hidden rounded-lg bg-white/5 transition hover:opacity-90"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={photo.caption ?? "Photo"} className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  );
}
