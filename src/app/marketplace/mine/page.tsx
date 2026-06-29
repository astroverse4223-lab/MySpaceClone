"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ListingSummary {
  id: string;
  title: string;
  priceCents: number;
  images: string[];
  status: string;
}

function formatPrice(cents: number) {
  return cents === 0 ? "Free" : `$${(cents / 100).toLocaleString()}`;
}

const statusLabels: Record<string, string> = { ACTIVE: "Active", PENDING: "Pending", SOLD: "Sold" };

export default function MyListingsPage() {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/marketplace?mine=1")
      .then((res) => res.json())
      .then((json) => {
        setListings(json.listings ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My listings</h1>
        <Link href="/marketplace/new" className="rounded-full bg-violet-500 px-4 py-1.5 text-sm font-medium hover:bg-violet-400">
          + Sell something
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-white/40">Loading...</p>
        ) : listings.length === 0 ? (
          <p className="text-sm text-white/40">You haven't posted any listings yet.</p>
        ) : (
          listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/marketplace/${listing.id}`}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
                {listing.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{listing.title}</p>
                <p className="text-sm text-white/50">{formatPrice(listing.priceCents)}</p>
              </div>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">
                {statusLabels[listing.status]}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
