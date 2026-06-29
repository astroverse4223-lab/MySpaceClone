"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

const PRESETS = [5, 10, 25, 50, 100];

function DonateContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const [amount, setAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const activeAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  function choosePreset(value: number) {
    setAmount(value);
    setCustomAmount("");
  }

  async function donate() {
    if (activeAmount < 1) return;
    setSubmitting(true);
    setError(undefined);
    const res = await fetch("/api/donate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCents: Math.round(activeAmount * 100),
        message: message || undefined,
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
      return;
    }
    window.location.href = json.url;
  }

  return (
    <div className="relative mx-auto max-w-xl overflow-hidden px-6 py-16">
      <span
        aria-hidden
        className="animate-float-blob pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--site-accent)" }}
      />
      <span
        aria-hidden
        className="animate-float-blob pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--site-accent-2)", animationDelay: "-9s" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative text-center"
      >
        <span className="text-4xl">💜</span>
        <h1 className="mt-3 text-2xl font-semibold">
          Support <span className="text-gradient-animated">MySpace Reborn</span>
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/50">
          This place is built and kept running independently. If it's brought you any joy, a donation
          helps cover hosting and keeps new features coming.
        </p>
      </motion.div>

      {status === "success" && (
        <p className="relative mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-center text-sm text-emerald-300">
          🎉 Thank you so much for your support!
        </p>
      )}
      {status === "cancelled" && (
        <p className="relative mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/60">
          Checkout cancelled — no charge was made.
        </p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="glass relative mt-8 rounded-2xl p-6"
      >
        <div className="grid grid-cols-5 gap-2">
          {PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => choosePreset(value)}
              className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                !customAmount && amount === value
                  ? "gradient-accent text-white shadow-lg shadow-black/20"
                  : "border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              ${value}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <span className="text-sm text-white/50">$</span>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Custom amount"
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
          />
        </div>

        <textarea
          rows={2}
          placeholder="Leave a message (optional)"
          className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-violet-400/60"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={300}
        />

        {error && <p className="mt-3 text-xs text-red-300">{error}</p>}

        <button
          onClick={donate}
          disabled={submitting || activeAmount < 1}
          className="gradient-accent mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:brightness-110 disabled:opacity-50"
        >
          {submitting ? "Redirecting…" : `Donate $${activeAmount > 0 ? activeAmount : 0}`}
        </button>
        <p className="mt-3 text-center text-[11px] text-white/30">
          Secure checkout powered by Stripe. One-time payment, no account required on their end.
        </p>
      </motion.div>
    </div>
  );
}

export default function DonatePage() {
  return (
    <Suspense fallback={null}>
      <DonateContent />
    </Suspense>
  );
}
