"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SearchResults } from "@/lib/search";

const EMPTY: SearchResults = { users: [], posts: [], communities: [], articles: [], events: [] };

export function SearchBox() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search as the user types.
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=4`, {
          signal: controller.signal,
        });
        if (res.ok) setResults(await res.json());
      } catch {
        /* aborted or failed — ignore */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function goToResults() {
    const query = q.trim();
    if (query.length < 1) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  const hasResults =
    results.users.length +
      results.posts.length +
      results.communities.length +
      results.articles.length +
      results.events.length >
    0;

  function close() {
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 focus-within:border-violet-400/50">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") goToResults();
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search…"
          className="w-32 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none lg:w-44"
          aria-label="Search MySpace Reborn"
        />
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c14]/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="max-h-[26rem] overflow-y-auto py-2">
            {loading && !hasResults ? (
              <p className="px-4 py-6 text-center text-sm text-white/40">Searching…</p>
            ) : !hasResults ? (
              <p className="px-4 py-6 text-center text-sm text-white/40">No matches found.</p>
            ) : (
              <>
                {results.users.length > 0 && (
                  <Section label="People">
                    {results.users.map((u) => (
                      <Link key={u.id} href={u.link} onClick={close} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-xs">
                          {u.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (u.name ?? u.username)[0]?.toUpperCase()
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-white/90">{u.name ?? u.username}</span>
                          <span className="block truncate text-xs text-white/40">@{u.username}</span>
                        </span>
                      </Link>
                    ))}
                  </Section>
                )}

                {results.communities.length > 0 && (
                  <Section label="Communities">
                    {results.communities.map((c) => (
                      <Link key={c.id} href={c.link} onClick={close} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-xs">
                          {c.iconImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.iconImage} alt="" className="h-full w-full rounded-lg object-cover" />
                          ) : (
                            "🏛️"
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-white/90">{c.name}</span>
                          <span className="block text-xs text-white/40">{c.memberCount} members</span>
                        </span>
                      </Link>
                    ))}
                  </Section>
                )}

                {results.articles.length > 0 && (
                  <Section label="Blog posts">
                    {results.articles.map((a) => (
                      <Link key={a.id} href={a.link} onClick={close} className="block px-4 py-2 hover:bg-white/5">
                        <span className="block truncate text-sm text-white/90">✍️ {a.title}</span>
                        <span className="block truncate text-xs text-white/40">@{a.authorUsername}</span>
                      </Link>
                    ))}
                  </Section>
                )}

                {results.events.length > 0 && (
                  <Section label="Events">
                    {results.events.map((e) => (
                      <Link key={e.id} href={e.link} onClick={close} className="block px-4 py-2 hover:bg-white/5">
                        <span className="block truncate text-sm text-white/90">📅 {e.title}</span>
                        <span className="block truncate text-xs text-white/40">
                          {new Date(e.startsAt).toLocaleDateString()}
                          {e.location ? ` · ${e.location}` : ""}
                        </span>
                      </Link>
                    ))}
                  </Section>
                )}

                {results.posts.length > 0 && (
                  <Section label="Posts">
                    {results.posts.map((p) => (
                      <Link key={p.id} href={p.link} onClick={close} className="block px-4 py-2 hover:bg-white/5">
                        <span className="line-clamp-2 text-sm text-white/80">{p.excerpt}</span>
                        <span className="block truncate text-xs text-white/40">@{p.authorUsername}</span>
                      </Link>
                    ))}
                  </Section>
                )}
              </>
            )}
          </div>

          <button
            onClick={goToResults}
            className="block w-full border-t border-white/10 px-4 py-2.5 text-center text-sm font-medium text-violet-300 hover:bg-white/5"
          >
            See all results for &ldquo;{q.trim()}&rdquo;
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/30">{label}</p>
      {children}
    </div>
  );
}
