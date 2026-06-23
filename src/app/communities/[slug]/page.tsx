"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { PostComposer } from "@/components/feed/post-composer";
import { PostCard } from "@/components/feed/post-card";
import { UserAvatar } from "@/components/friends/user-avatar";
import { uploadFile } from "@/lib/use-upload";
import { timeAgo } from "@/lib/time";
import type { SerializedPost } from "@/components/feed/types";

interface CommunityDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  bannerImage: string | null;
  iconImage: string | null;
  themeColor: string;
  visibility: string;
  _count: { members: number; posts: number };
}

interface Membership {
  role: string;
}

interface MemberRow {
  userId: string;
  role: string;
  points: number;
  user: { id: string; username: string; name: string | null; image: string | null };
}

interface Announcement {
  id: string;
  content: string;
  createdAt: string;
  author: { username: string; name: string | null };
}

const TABS = ["Discussion", "Announcements", "Members"] as const;

export default function CommunityDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const [community, setCommunity] = useState<CommunityDetail>();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Discussion");
  const [posts, setPosts] = useState<SerializedPost[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementDraft, setAnnouncementDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCustomize, setShowCustomize] = useState(false);

  const isStaff = membership && ["MODERATOR", "ADMIN", "OWNER"].includes(membership.role);

  const loadCommunity = useCallback(async () => {
    const res = await fetch(`/api/communities/${slug}`);
    const json = await res.json();
    setCommunity(json.community);
    setMembership(json.membership);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  useEffect(() => {
    if (tab === "Discussion" && community) {
      fetch(`/api/posts?communityId=${community.id}`)
        .then((res) => res.json())
        .then((json) => setPosts(json.posts ?? []));
    }
    if (tab === "Members" && community) {
      fetch(`/api/communities/${slug}/members`)
        .then((res) => res.json())
        .then((json) => setMembers(json.members ?? []));
    }
    if (tab === "Announcements" && community) {
      fetch(`/api/communities/${slug}/announcements`)
        .then((res) => res.json())
        .then((json) => setAnnouncements(json.announcements ?? []));
    }
  }, [tab, community, slug]);

  async function join() {
    const res = await fetch(`/api/communities/${slug}/join`, { method: "POST" });
    if (res.ok) loadCommunity();
  }

  async function leave() {
    const res = await fetch(`/api/communities/${slug}/leave`, { method: "POST" });
    if (res.ok) loadCommunity();
  }

  async function postAnnouncement() {
    if (!announcementDraft.trim()) return;
    const res = await fetch(`/api/communities/${slug}/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: announcementDraft }),
    });
    const json = await res.json();
    if (res.ok) {
      setAnnouncements((a) => [json.announcement, ...a]);
      setAnnouncementDraft("");
    }
  }

  async function changeRole(userId: string, role: string) {
    const res = await fetch(`/api/communities/${slug}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role } : m)));
    }
  }

  if (loading || !community) {
    return <p className="px-6 py-16 text-center text-white/60">Loading...</p>;
  }

  const accent = community.themeColor;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Cover */}
      <div
        className="relative h-40 overflow-hidden rounded-2xl bg-cover bg-center shadow-xl"
        style={{
          backgroundImage: community.bannerImage
            ? `url(${community.bannerImage})`
            : `linear-gradient(135deg, ${accent}, #0a0a0f)`,
        }}
      >
        {community.bannerImage && <div className="absolute inset-0 bg-black/20" />}
        <span className="absolute left-3 top-3 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur">
          {community.visibility === "PRIVATE" ? "🔒 Private" : "🌐 Public"}
        </span>
        {isStaff && (
          <button
            onClick={() => setShowCustomize(true)}
            className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur transition hover:bg-black/70"
          >
            ⚙️ Customize
          </button>
        )}
      </div>

      {/* Identity */}
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-3 px-1">
        <div className="-mt-8 flex items-end gap-3">
          <div
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#0a0a0f] bg-cover bg-center text-2xl font-bold shadow-2xl"
            style={{
              backgroundImage: community.iconImage ? `url(${community.iconImage})` : undefined,
              backgroundColor: community.iconImage ? undefined : accent,
            }}
          >
            {!community.iconImage && community.name[0]?.toUpperCase()}
          </div>
          <div className="pb-1">
            <h1 className="text-xl font-semibold">{community.name}</h1>
            <p className="text-sm text-white/50">
              {community._count.members} members · {community._count.posts} posts
            </p>
          </div>
        </div>
        {session?.user &&
          (membership ? (
            <button
              onClick={leave}
              className="rounded-full border border-white/15 px-4 py-1.5 text-sm hover:bg-white/5"
            >
              Joined
            </button>
          ) : (
            <button
              onClick={join}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-white shadow-lg transition hover:brightness-110"
              style={{ backgroundColor: accent }}
            >
              Join
            </button>
          ))}
      </div>
      {community.description && <p className="mt-3 px-1 text-sm text-white/70">{community.description}</p>}

      <div className="mt-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-full px-4 py-1.5 text-sm transition"
            style={
              tab === t
                ? { backgroundColor: accent, color: "#fff" }
                : { border: "1px solid rgba(255,255,255,0.15)" }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Discussion" && (
        <div className="mt-6 space-y-4">
          {membership ? (
            <PostComposer communityId={community.id} onPosted={(p) => setPosts((prev) => [p, ...prev])} />
          ) : (
            <p className="text-sm text-white/40">Join this community to post.</p>
          )}
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpdate={(updated) => setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
              onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
            />
          ))}
          {posts.length === 0 && <p className="text-sm text-white/40">No discussion yet.</p>}
        </div>
      )}

      {tab === "Announcements" && (
        <div className="mt-6 space-y-4">
          {isStaff && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <textarea
                className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-white/30"
                rows={2}
                placeholder="Post an announcement..."
                value={announcementDraft}
                onChange={(e) => setAnnouncementDraft(e.target.value)}
              />
              <button
                onClick={postAnnouncement}
                className="mt-2 rounded-full px-4 py-1.5 text-sm font-medium text-white"
                style={{ backgroundColor: accent }}
              >
                Post
              </button>
            </div>
          )}
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/90">{a.content}</p>
              <p className="mt-2 text-xs text-white/40">
                {a.author.name ?? a.author.username} · {timeAgo(a.createdAt)}
              </p>
            </div>
          ))}
          {announcements.length === 0 && <p className="text-sm text-white/40">No announcements yet.</p>}
        </div>
      )}

      {tab === "Members" && (
        <div className="mt-6 space-y-2">
          {members.map((m) => (
            <div
              key={m.userId}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <UserAvatar name={m.user.name ?? m.user.username} image={m.user.image} size={32} />
                <div>
                  <p className="text-sm font-medium">{m.user.name ?? m.user.username}</p>
                  <p className="text-xs text-white/40">
                    {m.role} · {m.points} pts
                  </p>
                </div>
              </div>
              {isStaff && membership?.role !== "MODERATOR" && m.role !== "OWNER" && (
                <select
                  value={m.role}
                  onChange={(e) => changeRole(m.userId, e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs"
                >
                  <option value="MEMBER">Member</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              )}
            </div>
          ))}
        </div>
      )}

      {showCustomize && (
        <CustomizeModal
          slug={slug}
          community={community}
          onClose={() => setShowCustomize(false)}
          onSaved={(updated) => {
            setCommunity((c) => (c ? { ...c, ...updated } : c));
            setShowCustomize(false);
          }}
        />
      )}
    </div>
  );
}

function CustomizeModal({
  slug,
  community,
  onClose,
  onSaved,
}: {
  slug: string;
  community: CommunityDetail;
  onClose: () => void;
  onSaved: (updated: Partial<CommunityDetail>) => void;
}) {
  const [description, setDescription] = useState(community.description ?? "");
  const [themeColor, setThemeColor] = useState(community.themeColor);
  const [bannerImage, setBannerImage] = useState(community.bannerImage ?? "");
  const [iconImage, setIconImage] = useState(community.iconImage ?? "");
  const [visibility, setVisibility] = useState(community.visibility);
  const [busy, setBusy] = useState<"banner" | "icon" | "save" | null>(null);
  const [error, setError] = useState<string>();
  const bannerRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>, which: "banner" | "icon") {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(which);
    setError(undefined);
    try {
      const url = await uploadFile(file);
      if (which === "banner") setBannerImage(url);
      else setIconImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    setBusy("save");
    setError(undefined);
    const body: Record<string, unknown> = { description, themeColor, visibility };
    if (bannerImage) body.bannerImage = bannerImage;
    if (iconImage) body.iconImage = iconImage;
    const res = await fetch(`/api/communities/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setBusy(null);
    if (res.ok) {
      onSaved({ description, themeColor, bannerImage, iconImage, visibility });
    } else {
      setError(json.error ?? "Could not save");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0f] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white">Customize community</h2>

        <label className="mt-4 block text-xs font-medium text-white/50">Cover photo</label>
        <div
          className="mt-1 h-24 rounded-lg bg-cover bg-center"
          style={{
            backgroundImage: bannerImage
              ? `url(${bannerImage})`
              : `linear-gradient(135deg, ${themeColor}, #0a0a0f)`,
          }}
        />
        <input ref={bannerRef} type="file" accept="image/*" onChange={(e) => pick(e, "banner")} className="hidden" />
        <button
          onClick={() => bannerRef.current?.click()}
          disabled={busy === "banner"}
          className="mt-2 w-full rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5 disabled:opacity-50"
        >
          {busy === "banner" ? "Uploading..." : "Change cover photo"}
        </button>

        <label className="mt-4 block text-xs font-medium text-white/50">Group icon</label>
        <div className="mt-1 flex items-center gap-3">
          <div
            className="h-14 w-14 rounded-xl bg-cover bg-center"
            style={{
              backgroundImage: iconImage ? `url(${iconImage})` : undefined,
              backgroundColor: iconImage ? undefined : themeColor,
            }}
          />
          <input ref={iconRef} type="file" accept="image/*" onChange={(e) => pick(e, "icon")} className="hidden" />
          <button
            onClick={() => iconRef.current?.click()}
            disabled={busy === "icon"}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5 disabled:opacity-50"
          >
            {busy === "icon" ? "Uploading..." : "Change icon"}
          </button>
        </div>

        <label className="mt-4 block text-xs font-medium text-white/50">Theme color</label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="color"
            value={themeColor}
            onChange={(e) => setThemeColor(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
          />
          <span className="text-sm text-white/70">{themeColor}</span>
        </div>

        <label className="mt-4 block text-xs font-medium text-white/50">Description</label>
        <textarea
          className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/60"
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="mt-4 block text-xs font-medium text-white/50">Visibility</label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="PUBLIC">🌐 Public</option>
          <option value="PRIVATE">🔒 Private</option>
        </select>

        {error && <p className="mt-3 text-xs text-red-300">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy !== null}
            className="flex-1 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400 disabled:opacity-50"
          >
            {busy === "save" ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
