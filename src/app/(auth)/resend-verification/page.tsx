"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthCard, FormSuccess, FormError, inputClass, buttonClass } from "@/components/auth/auth-card";

export default function ResendVerificationPage() {
  return (
    <Suspense>
      <ResendVerificationContent />
    </Suspense>
  );
}

function ResendVerificationContent() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Couldn't send the email. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <AuthCard title="Check your email">
        <FormSuccess message="If that email belongs to an unverified account, we just sent a fresh verification link. It expires in 24 hours." />
        <Link href="/login" className="mt-4 block text-center text-sm text-white/50 hover:text-white">
          Back to log in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Resend verification email" subtitle="We'll send you a new link to verify your account.">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <input
          className={inputClass}
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Sending..." : "Send verification link"}
        </button>
      </form>
      <Link href="/login" className="mt-4 block text-center text-sm text-white/50 hover:text-white">
        Back to log in
      </Link>
    </AuthCard>
  );
}
