"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/use-upload";
import { listingCategories, listingConditions } from "@/lib/validations/marketplace";

const conditionLabels: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like new",
  GOOD: "Good",
  FAIR: "Fair",
  WORN: "Worn",
};

export default function NewListingPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<string>(listingCategories[0]);
  const [condition, setCondition] = useState<string>("GOOD");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const input = "w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-violet-400/60";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.slice(0, 8 - images.length).map(uploadFile));
      setImages((prev) => [...prev, ...urls].slice(0, 8));
    } catch {
      setError("Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  async function create() {
    setSaving(true);
    setError(undefined);
    const priceCents = Math.round(Number(price || 0) * 100);
    const res = await fetch("/api/marketplace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        priceCents,
        category,
        condition,
        location,
        images,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error);
      return;
    }
    router.push(`/marketplace/${json.listing.id}`);
  }

  const canSubmit = title.trim() && description.trim() && location.trim() && price !== "" && !saving;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Sell something</h1>
      <p className="mt-1 text-sm text-white/40">Local sale, cash in hand — no online payments.</p>

      <div className="mt-6 space-y-4">
        {error && <p className="text-sm text-red-300">{error}</p>}

        <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFile} className="hidden" />
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Listing photo" className="h-full w-full object-cover" />
              <button
                onClick={() => removeImage(url)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/70 px-1.5 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
          {images.length < 8 && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-white/20 text-xs text-white/50 hover:bg-white/5 disabled:opacity-50"
            >
              {uploading ? "..." : "+ Photo"}
            </button>
          )}
        </div>

        <input className={input} placeholder="What are you selling?" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          className={input}
          rows={4}
          placeholder="Describe the item — condition, details, why you're selling..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex gap-3">
          <input
            className={input}
            type="number"
            min="0"
            step="0.01"
            placeholder="Price (USD, 0 for free)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <input className={input} placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div>
          <p className="mb-1.5 text-xs text-white/40">Category</p>
          <div className="flex flex-wrap gap-2">
            {listingCategories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1 text-xs ${category === c ? "bg-violet-500" : "border border-white/15"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs text-white/40">Condition</p>
          <div className="flex flex-wrap gap-2">
            {listingConditions.map((c) => (
              <button
                key={c}
                onClick={() => setCondition(c)}
                className={`rounded-full px-3 py-1 text-xs ${condition === c ? "bg-violet-500" : "border border-white/15"}`}
              >
                {conditionLabels[c]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={create}
          disabled={!canSubmit}
          className="w-full rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium hover:bg-violet-400 disabled:opacity-50"
        >
          {saving ? "Posting..." : "Post listing"}
        </button>
      </div>
    </div>
  );
}
