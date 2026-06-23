import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializePosts } from "@/lib/posts";
import { ProfilePosts } from "@/components/feed/profile-posts";
import type { SerializedPost } from "@/components/feed/types";
import { extractHashtags } from "@/lib/text";

export const metadata: Metadata = {
  title: "Explore | MySpace Reborn",
  description: "Trending posts, hashtags, creators and communities.",
};

const postInclude = {
  author: { select: { id: true, username: true, name: true, image: true } },
  reactions: true,
  _count: { select: { comments: true, reposts: true } },
} as const;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const session = await auth();
  const viewerId = session?.user?.id;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [recentForTags, trendingRaw, tagPostsRaw, communities] = await Promise.all([
    prisma.post.findMany({
      where: { isReel: false, content: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { content: true },
    }),
    prisma.post.findMany({
      where: { isReel: false, communityId: null, createdAt: { gte: weekAgo } },
      orderBy: [{ reactions: { _count: "desc" } }, { createdAt: "desc" }],
      take: 10,
      include: postInclude,
    }),
    tag
      ? prisma.post.findMany({
          where: { isReel: false, content: { contains: `#${tag}`, mode: "insensitive" } },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: postInclude,
        })
      : Promise.resolve([]),
    prisma.community.findMany({
      orderBy: { members: { _count: "desc" } },
      take: 6,
      select: { slug: true, name: true, description: true, iconImage: true, _count: { select: { members: true } } },
    }),
  ]);

  // Tally trending hashtags from recent post content.
  const counts = new Map<string, number>();
  for (const p of recentForTags) {
    for (const t of extractHashtags(p.content)) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const trendingTags = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);

  const trending = (await serializePosts(trendingRaw, viewerId)).map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  })) as SerializedPost[];

  const tagPosts = tag
    ? ((await serializePosts(tagPostsRaw, viewerId)).map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })) as SerializedPost[])
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {tag ? (
            <>
              <span className="text-accent">#{tag}</span>
            </>
          ) : (
            <>Explore 🧭</>
          )}
        </h1>
        {tag && (
          <Link href="/explore" className="mt-1 inline-block text-sm text-white/50 hover:text-white/80">
            ← Back to Explore
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0">
          {tag ? (
            <section>
              <h2 className="mb-3 text-sm font-medium text-white/50">Posts tagged #{tag}</h2>
              {tagPosts.length === 0 ? (
                <p className="text-sm text-white/40">No posts with this hashtag yet.</p>
              ) : (
                <ProfilePosts initialPosts={tagPosts} />
              )}
            </section>
          ) : (
            <section>
              <h2 className="mb-3 text-sm font-medium text-white/50">🔥 Trending this week</h2>
              {trending.length === 0 ? (
                <p className="text-sm text-white/40">No trending posts yet — be the one to start something.</p>
              ) : (
                <ProfilePosts initialPosts={trending} />
              )}
            </section>
          )}
        </main>

        <aside className="space-y-4">
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-semibold">Trending tags</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {trendingTags.length === 0 ? (
                <p className="text-xs text-white/40">No hashtags yet. Try posting with #yourtag!</p>
              ) : (
                trendingTags.map(([t, n]) => (
                  <Link
                    key={t}
                    href={`/explore?tag=${encodeURIComponent(t)}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm transition hover:border-white/30"
                  >
                    <span className="text-accent">#{t}</span> <span className="text-white/30">{n}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Communities</h3>
              <Link href="/communities" className="text-xs text-white/40 hover:text-white/70">
                All
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {communities.length === 0 ? (
                <p className="text-xs text-white/40">No communities yet.</p>
              ) : (
                communities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/communities/${c.slug}`}
                    className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 transition hover:bg-white/10"
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/10 text-sm"
                      style={{ backgroundImage: c.iconImage ? `url(${c.iconImage})` : undefined, backgroundSize: "cover" }}
                    >
                      {!c.iconImage && c.name[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-white/40">{c._count.members} members</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
