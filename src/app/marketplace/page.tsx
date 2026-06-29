"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { listingCategories } from "@/lib/validations/marketplace";

interface ListingSummary {
  id: string;
  title: string;
  priceCents: number;
  category: string;
  location: string;
  images: string[];
  status: string;
  seller: { username: string; name: string | null };
}

function formatPrice(cents: number) {
  return cents === 0 ? "Free" : `$${(cents / 100).toLocaleString()}`;
}

export default function MarketplacePage() {
  const { data: session } = useSession();
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("");
  const [q, setQ] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    fetch(`/api/marketplace?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        setListings(json.listings ?? []);
        setLoading(false);
      });
  }, [category, q]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">🛒 Marketplace</h1>
          <p className="mt-1 text-sm text-white/40">Buy and sell locally — cash in hand, no fees.</p>
        </div>
        <div className="flex gap-2">
          {session?.user && (
            <Link href="/marketplace/mine" className="rounded-full border border-white/15 px-4 py-1.5 text-sm hover:bg-white/5">
              My listings
            </Link>
          )}
          {session?.user && (
            <Link href="/marketplace/new" className="rounded-full bg-violet-500 px-4 py-1.5 text-sm font-medium hover:bg-violet-400">
              + Sell something
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <input
          className="w-full max-w-xs rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-sm outline-none focus:border-violet-400/60 sm:w-auto"
          placeholder="Search listings..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          onClick={() => setCategory("")}
          className={`rounded-full px-3 py-1.5 text-xs ${category === "" ? "bg-violet-500" : "border border-white/15 hover:bg-white/5"}`}
        >
          All
        </button>
        {listingCategories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1.5 text-xs ${category === c ? "bg-violet-500" : "border border-white/15 hover:bg-white/5"}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {loading ? (
          <p className="col-span-full text-sm text-white/40">Loading...</p>
        ) : listings.length === 0 ? (
          <p className="col-span-full text-sm text-white/40">No listings found.</p>
        ) : (
          listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/marketplace/${listing.id}`}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:bg-white/10"
            >
              <div className="aspect-square bg-white/5">
                {listing.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold">{formatPrice(listing.priceCents)}</p>
                <p className="mt-0.5 truncate text-sm text-white/80">{listing.title}</p>
                <p className="mt-0.5 truncate text-xs text-white/40">{listing.location}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
