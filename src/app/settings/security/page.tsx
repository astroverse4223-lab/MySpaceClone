"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function SecuritySettingsPage() {
  const { data: session, update } = useSession();
  const [qrCode, setQrCode] = useState<string>();
  const [secret, setSecret] = useState<string>();
  const [code, setCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  async function startSetup() {
    setError(undefined);
    const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error);
      return;
    }
    setQrCode(json.qrCodeDataUrl);
    setSecret(json.secret);
  }

  async function confirmSetup() {
    setError(undefined);
    const res = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error);
      return;
    }
    setMessage("Two-factor authentication is now enabled.");
    setQrCode(undefined);
    await update();
  }

  async function disable2fa() {
    setError(undefined);
    const res = await fetch("/api/auth/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: disablePassword }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error);
      return;
    }
    setMessage("Two-factor authentication has been disabled.");
    setDisablePassword("");
    await update();
  }

  if (!session?.user) {
    return <p className="px-6 py-16 text-center text-white/60">Please log in to manage security settings.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Security</h1>
      <p className="mt-1 text-sm text-white/60">Manage two-factor authentication for your account.</p>

      {message && (
        <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        {!qrCode ? (
          <>
            <h2 className="font-medium">Authenticator app</h2>
            <p className="mt-1 text-sm text-white/60">
              Use an app like Google Authenticator or 1Password to generate login codes.
            </p>
            <button
              onClick={startSetup}
              className="mt-4 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium hover:bg-violet-400"
            >
              Set up two-factor authentication
            </button>

            <div className="mt-8 border-t border-white/10 pt-6">
              <h2 className="font-medium text-red-300">Disable two-factor authentication</h2>
              <input
                className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-red-400/60"
                type="password"
                placeholder="Confirm your password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
              <button
                onClick={disable2fa}
                className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20"
              >
                Disable 2FA
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-medium">Scan this QR code</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="2FA QR code" width={200} height={200} className="mt-4 rounded-lg bg-white p-2" />
            <p className="mt-3 text-xs text-white/50">Or enter this code manually: {secret}</p>
            <input
              className="mt-4 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-violet-400/60"
              placeholder="Enter the 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              onClick={confirmSetup}
              className="mt-3 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium hover:bg-violet-400"
            >
              Confirm and enable
            </button>
          </>
        )}
      </div>
    </div>
  );
}
