"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";

export function PwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Register the service worker — required for Android's install prompt.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    // Already installed / launched from the home screen — nothing to offer.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* localStorage unavailable — just continue */
    }

    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIOS(ios);

    // Android / Chrome fire this when the app meets install criteria.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS Safari has no prompt event — show the manual instructions instead.
    if (ios) setShow(true);

    const onInstalled = () => setShow(false);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md rounded-2xl border border-white/10 bg-[#13121c]/95 p-4 shadow-2xl backdrop-blur-xl sm:left-auto sm:right-3 sm:mx-0">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Install MySpace Reborn</p>
          {isIOS ? (
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              Tap the Share button <span aria-hidden>⎋</span> at the bottom of Safari, then choose{" "}
              <span className="font-medium text-white/80">Add to Home Screen</span> ➕.
            </p>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              Add it to your home screen for a full-screen, app-like experience.
            </p>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-white/40 transition hover:text-white"
        >
          ✕
        </button>
      </div>
      {!isIOS && deferred && (
        <button
          onClick={install}
          className="mt-3 w-full rounded-xl bg-gradient-to-r from-violet-400 to-pink-400 px-4 py-2 text-sm font-bold text-black transition hover:opacity-90"
        >
          Install app
        </button>
      )}
    </div>
  );
}
