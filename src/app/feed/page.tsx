import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FeedStream } from "@/components/feed/feed-stream";
import { SuggestedPeople } from "@/components/feed/suggested-people";
import { TrendingTags } from "@/components/feed/trending-tags";
import { getTheme } from "@/lib/themes";
import { getBlockedUserIds } from "@/lib/social";

const QUICK_LINKS = [
  { href: "/explore", label: "Explore", emoji: "🧭" },
  { href: "/friends", label: "Friends", emoji: "🫂" },
  { href: "/messages", label: "Messages", emoji: "✉️" },
  { href: "/communities", label: "Communities", emoji: "🏛️" },
  { href: "/events", label: "Events", emoji: "📅" },
  { href: "/reels", label: "Reels", emoji: "🎬" },
  { href: "/games", label: "Games", emoji: "🎮" },
  { href: "/blog", label: "Blog", emoji: "📝" },
  { href: "/playlists", label: "Playlists", emoji: "🎧" },
];

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const me = session.user.id;

  const [profile, friendCount, badgeCount, relationships, upcomingEvents, myMemberships, friendRels] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: me } }),
    prisma.friendship.count({ where: { status: "ACCEPTED", OR: [{ requesterId: me }, { addresseeId: me }] } }),
    prisma.userBadge.count({ where: { userId: me } }),
    prisma.friendship.findMany({
      where: { OR: [{ requesterId: me }, { addresseeId: me }] },
      select: { requesterId: true, addresseeId: true },
    }),
    prisma.event.findMany({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 3,
      select: { id: true, title: true, startsAt: true, isOnline: true, location: true },
    }),
    prisma.communityMember.findMany({
      where: { userId: me },
      orderBy: { joinedAt: "desc" },
      take: 6,
      include: { community: { select: { slug: true, name: true, iconImage: true, themeColor: true } } },
    }),
    prisma.friendship.findMany({
      where: { status: "ACCEPTED", OR: [{ requesterId: me }, { addresseeId: me }] },
      take: 14,
      include: {
        requester: { select: { id: true, username: true, name: true, image: true, profile: { select: { avatarImage: true } } } },
        addressee: { select: { id: true, username: true, name: true, image: true, profile: { select: { avatarImage: true } } } },
      },
    }),
  ]);

  const connectedIds = new Set<string>([me]);
  for (const r of relationships) {
    connectedIds.add(r.requesterId);
    connectedIds.add(r.addresseeId);
  }
  for (const id of await getBlockedUserIds(me)) connectedIds.add(id);

  // The "other" user in each accepted friendship.
  const friends = friendRels.map((r) => (r.requester.id === me ? r.addressee : r.requester));

  // Popular communities to suggest when the user hasn't joined any yet.
  const popularCommunities =
    myMemberships.length === 0
      ? await prisma.community.findMany({
          where: { visibility: "PUBLIC" },
          orderBy: { members: { _count: "desc" } },
          take: 4,
          select: { slug: true, name: true, iconImage: true, themeColor: true },
        })
      : [];

  const suggestedRaw = await prisma.user.findMany({
    where: { id: { notIn: [...connectedIds] }, isSuspended: false },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { username: true, name: true, image: true, profile: { select: { avatarImage: true, headline: true } } },
  });
  const suggested = suggestedRaw.map((u) => ({
    username: u.username,
    name: u.name,
    avatar: u.profile?.avatarImage ?? u.image,
    headline: u.profile?.headline ?? null,
  }));

  const accent = profile?.accentColor || getTheme(profile?.theme).accent;
  const profileComplete = Boolean(profile?.avatarImage && profile?.bio && (profile?.interests?.length ?? 0) > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        {/* Left sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="glass overflow-hidden rounded-2xl">
              <div
                className="h-16 w-full bg-cover bg-center"
                style={{
                  backgroundImage: profile?.coverImage
                    ? `url(${profile.coverImage})`
                    : `linear-gradient(135deg, ${accent}, transparent)`,
                }}
              />
              <div className="px-4 pb-4">
                <div
                  className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#0a0a0f] bg-white/10 bg-cover bg-center text-xl font-semibold"
                  style={{ backgroundImage: profile?.avatarImage ? `url(${profile.avatarImage})` : undefined }}
                >
                  {!profile?.avatarImage && (profile?.displayName ?? session.user.username)[0]?.toUpperCase()}
                </div>
                <p className="mt-2 font-semibold">{profile?.displayName ?? session.user.username}</p>
                <p className="text-xs text-white/40">@{session.user.username}</p>
                {(profile?.mood || profile?.moodEmoji) && (
                  <p className="mt-1 text-xs text-white/60">
                    {profile?.moodEmoji} {profile?.mood}
                  </p>
                )}
                <div className="mt-3 flex gap-3 text-center text-xs">
                  <div className="flex-1 rounded-lg bg-white/5 py-2">
                    <div className="font-semibold">{(profile?.profileViews ?? 0).toLocaleString()}</div>
                    <div className="text-white/40">views</div>
                  </div>
                  <div className="flex-1 rounded-lg bg-white/5 py-2">
                    <div className="font-semibold">{friendCount}</div>
                    <div className="text-white/40">friends</div>
                  </div>
                  <div className="flex-1 rounded-lg bg-white/5 py-2">
                    <div className="font-semibold">{badgeCount}</div>
                    <div className="text-white/40">badges</div>
                  </div>
                </div>
                <Link
                  href={`/profile/${session.user.username}`}
                  className="mt-3 block rounded-full py-1.5 text-center text-xs font-medium text-white"
                  style={{ backgroundColor: accent }}
                >
                  View my page
                </Link>
              </div>
            </div>

            <nav className="glass rounded-2xl p-2">
              {QUICK_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <span>{l.emoji}</span>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Center stream */}
        <main className="min-w-0">
          <h1 className="mb-2 text-2xl font-bold">Your Feed</h1>
          <FeedStream />
        </main>

        {/* Right sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            {!profileComplete && (
              <div className="glass rounded-2xl p-4">
                <h3 className="text-sm font-semibold">Complete your page ✨</h3>
                <p className="mt-1 text-xs text-white/50">
                  Add a photo, bio and interests so people can find you.
                </p>
                <Link
                  href="/profile/edit"
                  className="mt-3 block rounded-full border border-white/15 py-1.5 text-center text-xs font-medium transition hover:bg-white/10"
                >
                  Customize profile
                </Link>
              </div>
            )}

            <SuggestedPeople people={suggested} />

            <TrendingTags />

            {/* Your communities */}
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {myMemberships.length > 0 ? "Your communities 🏛️" : "Discover communities 🏛️"}
                </h3>
                <Link href="/communities" className="text-xs text-white/40 hover:text-white/70">
                  All
                </Link>
              </div>
              <div className="mt-3 space-y-1.5">
                {(myMemberships.length > 0
                  ? myMemberships.map((m) => m.community)
                  : popularCommunities
                ).map((c) => (
                  <Link
                    key={c.slug}
                    href={`/communities/${c.slug}`}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/10"
                  >
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-cover bg-center text-xs font-bold"
                      style={{
                        backgroundImage: c.iconImage ? `url(${c.iconImage})` : undefined,
                        backgroundColor: c.iconImage ? undefined : c.themeColor,
                      }}
                    >
                      {!c.iconImage && c.name[0]?.toUpperCase()}
                    </span>
                    <span className="truncate text-sm">{c.name}</span>
                  </Link>
                ))}
                {myMemberships.length === 0 && popularCommunities.length === 0 && (
                  <p className="text-xs text-white/40">No communities yet — start one!</p>
                )}
              </div>
            </div>

            {/* Your friends */}
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Your friends 🫂</h3>
                <Link href="/friends" className="text-xs text-white/40 hover:text-white/70">
                  All
                </Link>
              </div>
              {friends.length === 0 ? (
                <p className="mt-3 text-xs text-white/40">No friends yet. Find some in Explore!</p>
              ) : (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {friends.slice(0, 10).map((f) => {
                    const avatar = f.profile?.avatarImage ?? f.image;
                    return (
                      <Link key={f.id} href={`/profile/${f.username}`} title={f.name ?? f.username} className="group">
                        <span
                          className="grid aspect-square place-items-center overflow-hidden rounded-full bg-white/10 bg-cover bg-center text-xs font-semibold transition group-hover:ring-2 group-hover:ring-violet-400/60"
                          style={{ backgroundImage: avatar ? `url(${avatar})` : undefined }}
                        >
                          {!avatar && (f.name ?? f.username)[0]?.toUpperCase()}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Upcoming events 📅</h3>
                <Link href="/events" className="text-xs text-white/40 hover:text-white/70">
                  All
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                {upcomingEvents.length === 0 ? (
                  <p className="text-xs text-white/40">Nothing scheduled. Host one!</p>
                ) : (
                  upcomingEvents.map((e) => (
                    <Link
                      key={e.id}
                      href={`/events/${e.id}`}
                      className="block rounded-xl bg-white/5 px-3 py-2 transition hover:bg-white/10"
                    >
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-white/40">
                        {new Date(e.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        {" · "}
                        {e.isOnline ? "Online" : e.location ?? "In person"}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
