"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeSwitcher } from "@/components/theme-switcher";

const MORE_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/communities", label: "Communities" },
  { href: "/reels", label: "Reels" },
  { href: "/games", label: "Games" },
  { href: "/blog", label: "Blog" },
  { href: "/events", label: "Events" },
  { href: "/playlists", label: "Playlists" },
  { href: "/settings", label: "Settings" },
];

export function NavBar() {
  const { data: session, status } = useSession();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-white transition hover:opacity-90">
          MySpace<span className="text-gradient-animated">Reborn</span>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          {status === "loading" ? null : session?.user ? (
            <>
              <Link href="/feed" className="text-sm text-white/80 transition hover:text-white">
                Feed
              </Link>
              <Link href="/friends" className="text-sm text-white/80 transition hover:text-white">
                Friends
              </Link>
              <Link href="/messages" className="text-sm text-white/80 transition hover:text-white">
                Messages
              </Link>

              <NotificationBell />

              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen((v) => !v)}
                  className="text-sm text-white/80 transition hover:text-white"
                >
                  More ▾
                </button>
                {moreOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-black/90 p-2 backdrop-blur-xl">
                    {MORE_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMoreOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ))}
                    {(session.user.role === "ADMIN" ||
                      session.user.role === "MODERATOR" ||
                      session.user.email?.toLowerCase() === "countryboya20@gmail.com") && (
                      <Link
                        href="/admin"
                        onClick={() => setMoreOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-violet-300 hover:bg-white/10"
                      >
                        Admin dashboard
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <Link
                href={`/profile/${session.user.username}`}
                className="text-sm text-white/80 transition hover:text-white"
              >
                {session.user.username}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-white/80 transition hover:text-white">
                Log in
              </Link>
              <Link
                href="/register"
                className="gradient-accent rounded-full px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-black/20 transition hover:scale-105"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
