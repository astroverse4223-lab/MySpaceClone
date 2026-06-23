"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function save(status: "DRAFT" | "PUBLISHED") {
    setSaving(true);
    setError(undefined);
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        excerpt: excerpt || undefined,
        content,
        category: category || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        status,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error);
      return;
    }
    router.push(`/blog/${json.article.slug}`);
  }

  const input = "w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-violet-400/60";

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Write an article</h1>

      <div className="mt-6 space-y-4">
        {error && <p className="text-sm text-red-300">{error}</p>}
        <input className={input} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          className={input}
          placeholder="Excerpt (optional)"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className={input}
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input className={input} placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <textarea
          className={`${input} font-mono`}
          rows={16}
          placeholder="Write your article..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            onClick={() => save("DRAFT")}
            disabled={saving || !title || !content}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            onClick={() => save("PUBLISHED")}
            disabled={saving || !title || !content}
            className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium hover:bg-violet-400 disabled:opacity-50"
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
