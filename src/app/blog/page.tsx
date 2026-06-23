"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { timeAgo } from "@/lib/time";

interface ArticleSummary {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  publishedAt: string | null;
  author: { username: string; name: string | null };
}

export default function BlogPage() {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/articles")
      .then((res) => res.json())
      .then((json) => {
        setArticles(json.articles ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Blog</h1>
        {session?.user && (
          <div className="flex gap-3 text-sm">
            <Link href="/blog/mine" className="text-white/60 hover:text-white">
              My articles
            </Link>
            <Link href="/blog/new" className="rounded-full bg-violet-500 px-4 py-1.5 font-medium hover:bg-violet-400">
              Write
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-white/40">Loading...</p>
        ) : articles.length === 0 ? (
          <p className="text-sm text-white/40">No articles published yet.</p>
        ) : (
          articles.map((a) => (
            <Link
              key={a.slug}
              href={`/blog/${a.slug}`}
              className="block rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
            >
              <h2 className="font-medium">{a.title}</h2>
              {a.excerpt && <p className="mt-1 text-sm text-white/60">{a.excerpt}</p>}
              <p className="mt-2 text-xs text-white/40">
                {a.author.name ?? a.author.username} {a.publishedAt && `· ${timeAgo(a.publishedAt)}`}
                {a.category && ` · ${a.category}`}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
