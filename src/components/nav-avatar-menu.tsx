"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { UserAvatar } from "@/components/friends/user-avatar";

const MORE_LINKS = [
  { href: "/explore", label: "Explore", icon: "🧭" },
  { href: "/communities", label: "Communities", icon: "🏛️" },
  { href: "/reels", label: "Reels", icon: "🎬" },
  { href: "/marketplace", label: "Marketplace", icon: "🛒" },
  { href: "/games", label: "Games", icon: "🎮" },
  { href: "/blog", label: "Blog", icon: "✍️" },
  { href: "/events", label: "Events", icon: "📅" },
  { href: "/playlists", label: "Playlists", icon: "🎵" },
  { href: "/donate", label: "Donate", icon: "💜" },
];

export { MORE_LINKS };

export function NavAvatarMenu({
  username,
  name,
  image,
  isAdmin,
}: {
  username: string;
  name?: string | null;
  image?: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="block rounded-full ring-2 ring-transparent transition hover:ring-white/20"
      >
        <UserAvatar name={name ?? username} image={image} size={34} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c14]/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <Link
            href={`/profile/${username}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 border-b border-white/10 px-4 py-3 transition hover:bg-white/5"
          >
            <UserAvatar name={name ?? username} image={image} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{name ?? username}</p>
              <p className="truncate text-xs text-white/40">@{username}</p>
            </div>
          </Link>

          <div className="p-1.5">
            {MORE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <span>⚙️</span>
              Settings
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-violet-300 transition hover:bg-white/10"
              >
                <span>🛠️</span>
                Admin dashboard
              </Link>
            )}
          </div>

          <div className="border-t border-white/10 p-1.5">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-white/70 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <span>↪️</span>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
