"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  category: string;
  condition: string;
  location: string;
  images: string[];
  status: string;
  createdAt: string;
  seller: { id: string; username: string; name: string | null; image: string | null };
}

const conditionLabels: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like new",
  GOOD: "Good",
  FAIR: "Fair",
  WORN: "Worn",
};

function formatPrice(cents: number) {
  return cents === 0 ? "Free" : `$${(cents / 100).toLocaleString()}`;
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [listing, setListing] = useState<ListingDetail>();
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [messaging, setMessaging] = useState(false);

  async function load() {
    const res = await fetch(`/api/marketplace/${id}`);
    const json = await res.json();
    setListing(json.listing);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function setStatus(status: string) {
    await fetch(`/api/marketplace/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function deleteListing() {
    if (!confirm("Delete this listing?")) return;
    await fetch(`/api/marketplace/${id}`, { method: "DELETE" });
    router.push("/marketplace");
  }

  async function messageSeller() {
    if (!listing) return;
    setMessaging(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: listing.seller.username }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await fetch(`/api/conversations/${json.conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Hi! Is "${listing.title}" still available?` }),
      });
      router.push(`/messages/${json.conversationId}`);
    } catch {
      setMessaging(false);
    }
  }

  if (loading || !listing) {
    return <p className="px-6 py-16 text-center text-white/60">Loading...</p>;
  }

  const isOwner = session?.user?.id === listing.seller.id;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/marketplace" className="text-sm text-white/50 hover:text-white">
        ← Marketplace
      </Link>

      <div className="mt-4 grid gap-8 sm:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-white/5">
            {listing.images[activeImage] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.images[activeImage]} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-white/30">No photo</div>
            )}
          </div>
          {listing.images.length > 1 && (
            <div className="mt-2 flex gap-2">
              {listing.images.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActiveImage(i)}
                  className={`h-14 w-14 overflow-hidden rounded-lg border ${i === activeImage ? "border-violet-400" : "border-white/10"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {listing.status !== "ACTIVE" && (
            <span className="mb-2 inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-300">
              {listing.status === "SOLD" ? "Sold" : "Pending"}
            </span>
          )}
          <h1 className="text-2xl font-semibold">{formatPrice(listing.priceCents)}</h1>
          <p className="mt-1 text-lg text-white/90">{listing.title}</p>
          <p className="mt-1 text-sm text-white/40">
            {listing.location} · {conditionLabels[listing.condition]} · {listing.category}
          </p>

          <p className="mt-4 whitespace-pre-wrap text-white/80">{listing.description}</p>

          <div className="mt-6 flex items-center gap-2 text-sm">
            <span className="text-white/40">Seller:</span>
            <Link href={`/profile/${listing.seller.username}`} className="hover:underline">
              {listing.seller.name ?? listing.seller.username}
            </Link>
          </div>

          {isOwner ? (
            <div className="mt-6 space-y-2">
              <div className="flex gap-2">
                {["ACTIVE", "PENDING", "SOLD"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`rounded-full px-3 py-1.5 text-xs ${
                      listing.status === s ? "bg-violet-500" : "border border-white/15 hover:bg-white/5"
                    }`}
                  >
                    {s === "ACTIVE" ? "Active" : s === "PENDING" ? "Pending" : "Sold"}
                  </button>
                ))}
              </div>
              <button
                onClick={deleteListing}
                className="rounded-full border border-red-500/30 px-4 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
              >
                Delete listing
              </button>
            </div>
          ) : (
            session?.user && (
              <button
                onClick={messageSeller}
                disabled={messaging}
                className="mt-6 w-full rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium hover:bg-violet-400 disabled:opacity-50"
              >
                {messaging ? "Starting chat..." : "💬 Message seller"}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
