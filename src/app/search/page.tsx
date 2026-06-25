import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { globalSearch, totalResults } from "@/lib/search";
import { timeAgo } from "@/lib/time";

export const metadata: Metadata = {
  title: "Search | MySpace Reborn",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query.length >= 2 ? await globalSearch(query, 12) : null;
  const total = results ? totalResults(results) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {query ? (
          <>
            Results for <span className="text-accent">{query}</span>
          </>
        ) : (
          "Search"
        )}
      </h1>
      {results && (
        <p className="mt-1 text-sm text-white/40">
          {total === 0 ? "No matches found" : `${total} result${total === 1 ? "" : "s"}`}
        </p>
      )}

      {!results && (
        <p className="mt-6 text-sm text-white/50">
          Type at least 2 characters to search people, posts, communities, blogs and events.
        </p>
      )}

      {results && total === 0 && (
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-3xl">🔍</p>
          <p className="mt-3 text-sm text-white/60">
            Nothing matched &ldquo;{query}&rdquo;. Try a different spelling or fewer words.
          </p>
        </div>
      )}

      {results && total > 0 && (
        <div className="mt-6 space-y-8">
          {results.users.length > 0 && (
            <Group label="People">
              <div className="grid gap-2 sm:grid-cols-2">
                {results.users.map((u) => (
                  <Link
                    key={u.id}
                    href={u.link}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:border-violet-400/40 hover:bg-white/10"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-sm">
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (u.name ?? u.username)[0]?.toUpperCase()
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{u.name ?? u.username}</span>
                      <span className="block truncate text-xs text-white/40">
                        {u.headline ?? `@${u.username}`}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </Group>
          )}

          {results.communities.length > 0 && (
            <Group label="Communities">
              <div className="grid gap-2 sm:grid-cols-2">
                {results.communities.map((c) => (
                  <Link
                    key={c.id}
                    href={c.link}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:border-violet-400/40 hover:bg-white/10"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/10 text-base">
                      {c.iconImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.iconImage} alt="" className="h-full w-full rounded-lg object-cover" />
                      ) : (
                        "🏛️"
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{c.name}</span>
                      <span className="block truncate text-xs text-white/40">
                        {c.memberCount} members{c.description ? ` · ${c.description}` : ""}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </Group>
          )}

          {results.articles.length > 0 && (
            <Group label="Blog posts">
              <div className="space-y-2">
                {results.articles.map((a) => (
                  <Link
                    key={a.id}
                    href={a.link}
                    className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-violet-400/40 hover:bg-white/10"
                  >
                    <p className="text-sm font-medium">✍️ {a.title}</p>
                    {a.excerpt && <p className="mt-1 line-clamp-2 text-sm text-white/50">{a.excerpt}</p>}
                    <p className="mt-1 text-xs text-white/40">by @{a.authorUsername}</p>
                  </Link>
                ))}
              </div>
            </Group>
          )}

          {results.events.length > 0 && (
            <Group label="Events">
              <div className="space-y-2">
                {results.events.map((e) => (
                  <Link
                    key={e.id}
                    href={e.link}
                    className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-violet-400/40 hover:bg-white/10"
                  >
                    <p className="text-sm font-medium">📅 {e.title}</p>
                    <p className="mt-1 text-xs text-white/40">
                      {new Date(e.startsAt).toLocaleString()}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </Link>
                ))}
              </div>
            </Group>
          )}

          {results.posts.length > 0 && (
            <Group label="Posts">
              <div className="space-y-2">
                {results.posts.map((p) => (
                  <Link
                    key={p.id}
                    href={p.link}
                    className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-violet-400/40 hover:bg-white/10"
                  >
                    <p className="text-sm text-white/80">{p.excerpt}</p>
                    <p className="mt-1 text-xs text-white/40">
                      @{p.authorUsername} · {timeAgo(p.createdAt)}
                    </p>
                  </Link>
                ))}
              </div>
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-white/50">{label}</h2>
      {children}
    </section>
  );
}
