import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MembershipSection } from "@/components/creator/membership-section";
import { ProfileSongPlayer } from "@/components/profile/profile-song-player";
import { ProfileActions } from "@/components/profile/profile-actions";
import { ProfileFlair } from "@/components/profile/profile-flair";
import { Guestbook } from "@/components/profile/guestbook";
import { ProfilePosts } from "@/components/feed/profile-posts";
import { OnlineDot } from "@/components/realtime/online-dot";
import { serializePosts } from "@/lib/posts";
import type { SerializedPost } from "@/components/feed/types";
import { getTheme, getFontStack } from "@/lib/themes";
import { recordProfileView } from "@/lib/profile-views";
import { syncBadges, BADGES, type BadgeKey } from "@/lib/badges";
import { timeAgo } from "@/lib/time";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username }, include: { profile: true } });
  if (!user) return { title: "Profile not found" };

  const title = `${user.profile?.displayName ?? user.username} (@${user.username}) | MySpace Reborn`;
  const description = user.profile?.bio ?? `Check out ${user.username}'s page on MySpace Reborn.`;
  return { title, description, openGraph: { title, description } };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { username },
    include: { profile: true },
  });

  if (!user || !user.profile) {
    notFound();
  }

  const isOwner = session?.user?.id === user.id;
  const viewerId = session?.user?.id ?? null;

  // Record the view + keep badges fresh (both best-effort, never throw).
  await recordProfileView(user.id, viewerId);
  await syncBadges(user.id);

  const theme = getTheme(user.profile.theme);
  const accent = user.profile.accentColor || theme.accent;
  const fontStack = getFontStack(user.profile.fontFamily);
  const links = Array.isArray(user.profile.links) ? (user.profile.links as { label: string; url: string }[]) : [];
  const stickers = Array.isArray(user.profile.stickers)
    ? (user.profile.stickers as { emoji: string; x: number; y: number }[])
    : [];

  const [topFriends, playlists, tiers, badges, freshProfile, friendCount, recentViewers, recentPhotos, photoCount, albums, followerCount, followingCount, viewerFollow, viewerBlock] = await Promise.all([
    prisma.friendList.findUnique({
      where: { userId_name: { userId: user.id, name: "Top Friends" } },
      include: {
        entries: {
          orderBy: { position: "asc" },
          take: 12,
          include: { friendUser: { select: { id: true, username: true, name: true, profile: { select: { avatarImage: true } } } } },
        },
      },
    }),
    prisma.playlist.findMany({
      where: { userId: user.id },
      include: { tracks: { orderBy: { position: "asc" }, take: 5 } },
      take: 5,
    }),
    prisma.membershipTier.findMany({ where: { creatorId: user.id }, orderBy: { priceCents: "asc" } }),
    prisma.userBadge.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.profile.findUnique({ where: { userId: user.id }, select: { profileViews: true } }),
    prisma.friendship.count({
      where: { status: "ACCEPTED", OR: [{ requesterId: user.id }, { addresseeId: user.id }] },
    }),
    isOwner
      ? prisma.profileView.findMany({
          where: { profileUserId: user.id },
          orderBy: { viewedAt: "desc" },
          take: 12,
          include: { viewer: { select: { username: true, name: true, profile: { select: { avatarImage: true } } } } },
        })
      : Promise.resolve([]),
    prisma.photo.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, url: true, caption: true },
    }),
    prisma.photo.count({ where: { userId: user.id } }),
    prisma.album.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        _count: { select: { photos: true } },
        photos: { take: 1, orderBy: { createdAt: "desc" }, select: { url: true } },
      },
    }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    viewerId
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
        })
      : Promise.resolve(null),
    viewerId
      ? prisma.block.findUnique({
          where: { blockerId_blockedId: { blockerId: viewerId, blockedId: user.id } },
        })
      : Promise.resolve(null),
  ]);

  const profileViews = freshProfile?.profileViews ?? user.profile.profileViews;
  const earnedBadges = badges
    .map((b) => ({ key: b.badge as BadgeKey, meta: BADGES[b.badge as BadgeKey] }))
    .filter((b) => b.meta);

  const rawPosts = await prisma.post.findMany({
    where: { authorId: user.id, communityId: null, isReel: false },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      author: { select: { id: true, username: true, name: true, image: true } },
      reactions: true,
      _count: { select: { comments: true, reposts: true } },
    },
  });
  const serializedPosts = (await serializePosts(rawPosts, viewerId ?? undefined)).map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  })) as SerializedPost[];

  const hasBgImage = Boolean(user.profile.backgroundImage);

  return (
    <div
      className={theme.dark ? "relative min-h-screen text-stone-900" : "relative min-h-screen text-white"}
      style={{
        background: hasBgImage ? undefined : theme.pageBackground,
        backgroundImage: hasBgImage ? `url(${user.profile.backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
        fontFamily: fontStack,
      }}
    >
      {hasBgImage && <div className="pointer-events-none fixed inset-0 bg-black/55" />}
      <ProfileFlair effect={user.profile.cursorEffect} glitter={user.profile.glitter} bgEffect={user.profile.bgEffect} stickers={stickers} />
      <div className={`relative mx-auto max-w-3xl px-6 py-12 ${hasBgImage ? "text-white" : ""}`}>
        {/* Cover */}
        <div
          className="h-44 w-full rounded-2xl bg-cover bg-center shadow-xl"
          style={{
            backgroundImage: user.profile.coverImage ? `url(${user.profile.coverImage})` : undefined,
            background: user.profile.coverImage ? undefined : `linear-gradient(135deg, ${accent}, transparent)`,
          }}
        />

        {/* Identity */}
        <div className="flex flex-wrap items-end justify-between gap-3 px-2">
          <div className="-mt-12 flex items-end gap-4">
            <div
              className="flex h-28 w-28 items-center justify-center rounded-full border-4 bg-white/10 bg-cover bg-center text-4xl font-semibold shadow-2xl"
              style={{
                borderColor: accent,
                backgroundImage: user.profile.avatarImage ? `url(${user.profile.avatarImage})` : undefined,
              }}
            >
              {!user.profile.avatarImage && (user.profile.displayName ?? user.username)[0]?.toUpperCase()}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold">{user.profile.displayName ?? user.username}</h1>
              <p className="text-sm opacity-60">@{user.username}</p>
              {user.profile.headline && (
                <p className="mt-1 text-sm font-medium" style={{ color: accent }}>
                  {user.profile.headline}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/profile/${user.username}/photos`}
              className="rounded-full border px-4 py-1.5 text-sm transition hover:bg-white/10"
              style={{ borderColor: accent, color: accent }}
            >
              📷 View pictures
            </Link>
            {isOwner ? (
              <Link
                href="/profile/edit"
                className="rounded-full px-4 py-1.5 text-sm font-medium text-white shadow-lg transition hover:brightness-110"
                style={{ backgroundColor: accent }}
              >
                Edit profile
              </Link>
            ) : (
              viewerId && (
                <>
                  <Link
                    href={`/messages`}
                    className="rounded-full border px-4 py-1.5 text-sm transition hover:bg-white/10"
                    style={{ borderColor: accent, color: accent }}
                  >
                    Message
                  </Link>
                  <ProfileActions
                    username={user.username}
                    accent={accent}
                    initialFollowing={Boolean(viewerFollow)}
                    initialBlocked={Boolean(viewerBlock)}
                  />
                </>
              )
            )}
          </div>
        </div>

        {/* Mood + stats bar */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {(user.profile.mood || user.profile.moodEmoji) && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
              style={{ borderColor: accent }}
            >
              <span className="text-lg">{user.profile.moodEmoji || "💭"}</span>
              <span className="opacity-80">
                Mood: <span className="font-medium">{user.profile.mood || "—"}</span>
              </span>
            </span>
          )}
          <span className="rounded-full border border-current/15 bg-black/10 px-3 py-1 text-sm opacity-80">
            👀 {profileViews.toLocaleString()} {profileViews === 1 ? "view" : "views"}
          </span>
          <Link
            href="/friends"
            className="rounded-full border border-current/15 bg-black/10 px-3 py-1 text-sm opacity-80 transition hover:opacity-100"
          >
            🫂 {friendCount} {friendCount === 1 ? "friend" : "friends"}
          </Link>
          <span className="rounded-full border border-current/15 bg-black/10 px-3 py-1 text-sm opacity-80">
            👥 {followerCount} {followerCount === 1 ? "follower" : "followers"}
          </span>
          <span className="rounded-full border border-current/15 bg-black/10 px-3 py-1 text-sm opacity-80">
            ➡️ {followingCount} following
          </span>
        </div>

        {user.profile.profileSongUrl && (
          <div className="mt-6">
            <ProfileSongPlayer
              url={user.profile.profileSongUrl}
              title={user.profile.profileSongTitle}
              subtitle={`@${user.username}`}
            />
          </div>
        )}

        <div className="mt-8 space-y-6">
          {/* Badges */}
          {earnedBadges.length > 0 && (
            <section>
              <h2 className="text-sm font-medium opacity-50">Badges</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {earnedBadges.map(({ key, meta }) => (
                  <span
                    key={key}
                    title={meta.description}
                    className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${meta.gradient} px-3 py-1 text-sm font-medium text-white shadow`}
                  >
                    <span>{meta.emoji}</span>
                    {meta.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {user.profile.bio && (
            <section>
              <h2 className="text-sm font-medium opacity-50">About</h2>
              <p className="mt-2 whitespace-pre-wrap opacity-90">{user.profile.bio}</p>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium opacity-50">
                Posts {serializedPosts.length > 0 && <span className="opacity-60">({serializedPosts.length})</span>}
              </h2>
              {isOwner && (
                <Link href="/feed" className="text-xs hover:underline" style={{ color: accent }}>
                  Share something
                </Link>
              )}
            </div>
            <div className="mt-3">
              {serializedPosts.length === 0 ? (
                <p className="text-sm opacity-50">
                  {isOwner ? "You haven't posted yet — head to your feed to share something!" : "No posts yet."}
                </p>
              ) : (
                <ProfilePosts initialPosts={serializedPosts} />
              )}
            </div>
          </section>

          {albums.length > 0 && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium opacity-50">Albums</h2>
                <Link
                  href={`/profile/${user.username}/photos`}
                  className="text-xs hover:underline"
                  style={{ color: accent }}
                >
                  View all →
                </Link>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {albums.map((album) => {
                  const cover = album.coverImage ?? album.photos[0]?.url;
                  return (
                    <Link
                      key={album.id}
                      href={`/profile/${user.username}/photos`}
                      className="group overflow-hidden rounded-xl border border-current/10 bg-black/10 transition hover:scale-[1.02]"
                    >
                      <div
                        className="aspect-video bg-cover bg-center"
                        style={{
                          backgroundImage: cover ? `url(${cover})` : undefined,
                          backgroundColor: cover ? undefined : "rgba(255,255,255,0.06)",
                        }}
                      >
                        {!cover && (
                          <div className="flex h-full items-center justify-center text-2xl opacity-40">🖼️</div>
                        )}
                      </div>
                      <div className="px-3 py-2">
                        <p className="truncate text-sm font-medium">{album.name}</p>
                        <p className="text-xs opacity-50">
                          {album._count.photos} {album._count.photos === 1 ? "photo" : "photos"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {recentPhotos.length > 0 && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium opacity-50">
                  Photos <span className="opacity-60">({photoCount})</span>
                </h2>
                <Link
                  href={`/profile/${user.username}/photos`}
                  className="text-xs hover:underline"
                  style={{ color: accent }}
                >
                  View all →
                </Link>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {recentPhotos.map((photo) => (
                  <Link
                    key={photo.id}
                    href={`/profile/${user.username}/photos`}
                    className="aspect-square overflow-hidden rounded-lg bg-white/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={photo.caption ?? "Photo"} className="h-full w-full object-cover" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {user.profile.location && (
            <section>
              <h2 className="text-sm font-medium opacity-50">Location</h2>
              <p className="mt-2 opacity-90">📍 {user.profile.location}</p>
            </section>
          )}

          {user.profile.interests.length > 0 && (
            <section>
              <h2 className="text-sm font-medium opacity-50">Interests</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {user.profile.interests.map((interest) => (
                  <span key={interest} className="rounded-full border border-current/15 bg-black/10 px-3 py-1 text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </section>
          )}

          {!isOwner && <MembershipSection username={user.username} tiers={tiers} />}

          {links.length > 0 && (
            <section>
              <h2 className="text-sm font-medium opacity-50">Links</h2>
              <div className="mt-2 flex flex-col gap-1">
                {links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    style={{ color: accent }}
                  >
                    🔗 {link.label}
                  </a>
                ))}
              </div>
            </section>
          )}

          {user.profile.favoriteArtists.length > 0 && (
            <section>
              <h2 className="text-sm font-medium opacity-50">Favorite Artists</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {user.profile.favoriteArtists.map((artist) => (
                  <span key={artist} className="rounded-full border border-current/15 bg-black/10 px-3 py-1 text-sm">
                    🎵 {artist}
                  </span>
                ))}
              </div>
            </section>
          )}

          {playlists.length > 0 && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium opacity-50">Playlists</h2>
                {isOwner && (
                  <Link href="/playlists" className="text-xs hover:underline" style={{ color: accent }}>
                    Manage
                  </Link>
                )}
              </div>
              <div className="mt-3 space-y-3">
                {playlists.map((playlist) => (
                  <div key={playlist.id} className="rounded-xl border border-current/10 bg-black/10 p-3">
                    <p className="text-sm font-medium">🎧 {playlist.name}</p>
                    <p className="mt-1 text-xs opacity-50">{playlist.tracks.length} tracks</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {topFriends && topFriends.entries.length > 0 && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium opacity-50">
                  Top Friends <span className="opacity-60">({topFriends.entries.length})</span>
                </h2>
                {isOwner && (
                  <Link href="/friends/top-friends" className="text-xs hover:underline" style={{ color: accent }}>
                    Manage
                  </Link>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {topFriends.entries.map((entry) => {
                  const avatar = entry.friendUser.profile?.avatarImage;
                  return (
                    <Link
                      key={entry.id}
                      href={`/profile/${entry.friendUser.username}`}
                      className="flex flex-col items-center gap-2 rounded-xl border border-current/10 bg-black/10 p-3 text-center transition hover:scale-[1.03]"
                    >
                      <div className="relative">
                        <div
                          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white/10 text-lg font-semibold"
                          style={{ backgroundImage: avatar ? `url(${avatar})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}
                        >
                          {!avatar && (entry.friendUser.name ?? entry.friendUser.username)[0]?.toUpperCase()}
                        </div>
                        <OnlineDot userId={entry.friendUser.id} className="absolute bottom-0 right-0 h-3.5 w-3.5" />
                      </div>
                      <p className="truncate text-xs opacity-80">
                        {entry.friendUser.name ?? entry.friendUser.username}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recent visitors (owner only) */}
          {isOwner && recentViewers.length > 0 && (
            <section>
              <h2 className="text-sm font-medium opacity-50">👀 Recent visitors</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {recentViewers.map((v) => {
                  const avatar = v.viewer.profile?.avatarImage;
                  return (
                    <Link
                      key={v.id}
                      href={`/profile/${v.viewer.username}`}
                      className="flex items-center gap-2 rounded-full border border-current/10 bg-black/10 py-1 pl-1 pr-3 text-sm transition hover:bg-black/20"
                    >
                      <span
                        className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-white/10 text-xs"
                        style={{ backgroundImage: avatar ? `url(${avatar})` : undefined, backgroundSize: "cover" }}
                      >
                        {!avatar && (v.viewer.name ?? v.viewer.username)[0]?.toUpperCase()}
                      </span>
                      <span className="opacity-80">{v.viewer.name ?? v.viewer.username}</span>
                      <span className="text-xs opacity-40">{timeAgo(v.viewedAt)}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Guestbook */}
          <Guestbook username={user.username} viewerId={viewerId} isOwner={isOwner} accent={accent} />
        </div>
      </div>
    </div>
  );
}
