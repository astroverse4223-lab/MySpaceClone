"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SearchBox } from "@/components/search/search-box";
import { NavAvatarMenu, MORE_LINKS } from "@/components/nav-avatar-menu";

const PRIMARY_LINKS = [
  { href: "/feed", label: "Feed", icon: "🏠" },
  { href: "/whats-new", label: "What's New", icon: "✨" },
  { href: "/friends", label: "Friends", icon: "👥" },
  { href: "/messages", label: "Messages", icon: "💬" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function NavBar() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!searchOpen) return;
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [searchOpen]);

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

  // Admin area is restricted to the site owner email only.
  const isAdmin = session?.user?.email?.toLowerCase() === "countryboya20@gmail.com";

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div className="gradient-accent absolute inset-x-0 bottom-0 h-px opacity-40" />
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight text-white transition hover:opacity-90"
        >
          MySpace<span className="text-gradient-animated">Reborn</span>
        </Link>

        {/* Desktop navigation */}
        {status !== "loading" && session?.user && (
          <div className="relative hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 md:flex">
            {PRIMARY_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link key={link.href} href={link.href} className="relative rounded-full px-3.5 py-1.5 text-sm font-medium">
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="gradient-accent absolute inset-0 rounded-full shadow-lg shadow-black/20"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className={`relative z-10 transition ${active ? "text-white" : "text-white/55 hover:text-white"}`}>
                    {link.icon} {link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          {status === "loading" ? null : session?.user ? (
            <>
              <div ref={searchRef} className="hidden md:block">
                {searchOpen ? (
                  <SearchBox />
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    aria-label="Search"
                    className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="hidden md:block">
                <NotificationBell />
              </div>
              <div className="hidden md:block">
                <ThemeSwitcher />
              </div>

              <div className="hidden md:block">
                <NavAvatarMenu
                  username={session.user.username}
                  name={session.user.name}
                  image={session.user.image}
                  isAdmin={isAdmin}
                />
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <ThemeSwitcher />
              <Link href="/login" className="text-sm text-white/80 transition hover:text-white">
                Log in
              </Link>
              <Link
                href="/register"
                className="gradient-accent rounded-full px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-black/20 transition hover:scale-105"
              >
                Sign up
              </Link>
            </div>
          )}

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
                <div className="mb-3">
                  <SearchBox />
                </div>
                <div className="grid gap-1">
                  {[...PRIMARY_LINKS, ...MORE_LINKS].map((link) => {
                    const active = isActive(pathname, link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-base transition ${
                          active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span>{link.icon}</span>
                        {link.label}
                      </Link>
                    );
                  })}
                  <Link
                    href="/settings"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-base text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <span>⚙️</span>
                    Settings
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-base text-violet-300 transition hover:bg-white/10"
                    >
                      <span>🛠️</span>
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

