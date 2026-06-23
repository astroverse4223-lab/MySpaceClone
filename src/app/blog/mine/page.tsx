"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MyArticle {
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
}

export default function MyArticlesPage() {
  const [articles, setArticles] = useState<MyArticle[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/articles?mine=true");
    const json = await res.json();
    setArticles(json.articles ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePublish(slug: string, status: string) {
    await fetch(`/api/articles/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }),
    });
    load();
  }

  async function remove(slug: string) {
    await fetch(`/api/articles/${slug}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My articles</h1>
        <Link href="/blog/new" className="rounded-full bg-violet-500 px-4 py-1.5 text-sm font-medium hover:bg-violet-400">
          Write
        </Link>
      </div>

      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="text-sm text-white/40">Loading...</p>
        ) : articles.length === 0 ? (
          <p className="text-sm text-white/40">No articles yet.</p>
        ) : (
          articles.map((a) => (
            <div key={a.slug} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <Link href={`/blog/${a.slug}`} className="text-sm font-medium hover:underline">
                {a.title}
              </Link>
              <div className="flex items-center gap-3 text-xs">
                <span className={a.status === "PUBLISHED" ? "text-emerald-300" : "text-yellow-300"}>{a.status}</span>
                <button onClick={() => togglePublish(a.slug, a.status)} className="text-white/50 hover:text-white">
                  {a.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </button>
                <button onClick={() => remove(a.slug)} className="text-white/50 hover:text-red-300">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
