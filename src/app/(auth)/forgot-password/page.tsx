"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard, FormSuccess, inputClass, buttonClass } from "@/components/auth/auth-card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <AuthCard title="Check your email">
        <FormSuccess message="If an account exists for that email, we sent a password reset link." />
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot your password?" subtitle="We'll email you a reset link.">
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className={inputClass}
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <Link href="/login" className="mt-4 block text-center text-sm text-white/50 hover:text-white">
        Back to log in
      </Link>
    </AuthCard>
  );
}
