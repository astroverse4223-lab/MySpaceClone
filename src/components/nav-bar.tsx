"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeSwitcher } from "@/components/theme-switcher";

const PRIMARY_LINKS = [
  { href: "/feed", label: "Feed" },
  { href: "/friends", label: "Friends" },
  { href: "/messages", label: "Messages" },
];

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent the page behind the mobile menu from scrolling while it's open.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const isAdmin =
    session?.user?.role === "ADMIN" ||
    session?.user?.role === "MODERATOR" ||
    session?.user?.email?.toLowerCase() === "countryboya20@gmail.com";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight text-white transition hover:opacity-90"
        >
          MySpace<span className="text-gradient-animated">Reborn</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-4 md:flex">
          <ThemeSwitcher />
          {status === "loading" ? null : session?.user ? (
            <>
              {PRIMARY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/80 transition hover:text-white"
                >
                  {link.label}
                </Link>
              ))}

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
                    {isAdmin && (
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

        {/* Mobile controls */}
        <div className="flex items-center gap-1.5 md:hidden">
          {status !== "loading" && session?.user && <NotificationBell />}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            className="grid h-10 w-10 place-items-center rounded-lg text-white transition hover:bg-white/10"
          >
            <span className="relative block h-4 w-6">
              <span
                className={`absolute left-0 block h-0.5 w-6 rounded-full bg-current transition-transform duration-200 ${
                  mobileOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 block h-0.5 w-6 -translate-y-1/2 rounded-full bg-current transition-opacity duration-200 ${
                  mobileOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-6 rounded-full bg-current transition-transform duration-200 ${
                  mobileOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-white/10 bg-black/80 backdrop-blur-xl"
        >
          <div
            className="max-h-[calc(100dvh-4rem)] overflow-y-auto px-4 py-4"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Theme
              </span>
              <ThemeSwitcher />
            </div>

            {status === "loading" ? null : session?.user ? (
              <>
                <div className="grid gap-1">
                  {[...PRIMARY_LINKS, ...MORE_LINKS].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-lg px-3 py-2.5 text-base text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="rounded-lg px-3 py-2.5 text-base text-violet-300 transition hover:bg-white/10"
                    >
                      Admin dashboard
                    </Link>
                  )}
                </div>

                <div className="my-3 h-px bg-white/10" />

                <Link
                  href={`/profile/${session.user.username}`}
                  className="block rounded-lg px-3 py-2.5 text-base font-medium text-white transition hover:bg-white/10"
                >
                  {session.user.username}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="mt-2 w-full rounded-full bg-white/10 px-4 py-2.5 text-base font-medium text-white transition hover:bg-white/20"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="grid gap-2">
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2.5 text-center text-base text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="gradient-accent rounded-full px-4 py-2.5 text-center text-base font-medium text-white shadow-lg shadow-black/20"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
