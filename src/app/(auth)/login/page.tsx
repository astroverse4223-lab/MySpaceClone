"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthCard, FormError, inputClass, buttonClass } from "@/components/auth/auth-card";

const ERROR_MESSAGES: Record<string, string> = {
  "email-not-verified": "Please verify your email before logging in. Check your inbox for the link.",
  "totp-invalid": "That authentication code is incorrect.",
  "account-suspended": "Your account has been suspended. Contact support if you think this is a mistake.",
  credentials: "Incorrect email or password.",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string>();
  const [showResend, setShowResend] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    setShowResend(false);

    const res = await signIn("credentials", {
      email,
      password,
      totpCode: needsTotp ? totpCode : undefined,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      if (res.code === "totp-required") {
        setNeedsTotp(true);
        return;
      }
      if (res.code === "email-not-verified") {
        setShowResend(true);
      }
      setError((res.code && ERROR_MESSAGES[res.code]) ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to your page">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        {showResend && (
          <Link
            href={`/resend-verification${email ? `?email=${encodeURIComponent(email)}` : ""}`}
            className="-mt-2 block text-sm text-violet-400 hover:underline"
          >
            Didn&apos;t get the email? Resend verification link
          </Link>
        )}
        <input
          className={inputClass}
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={inputClass}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {needsTotp && (
          <input
            className={inputClass}
            placeholder="6-digit authentication code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            autoFocus
            required
          />
        )}
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Logging in..." : needsTotp ? "Verify code" : "Log in"}
        </button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/forgot-password" className="text-white/50 hover:text-white">
          Forgot password?
        </Link>
        <Link href="/register" className="text-violet-400 hover:underline">
          Create an account
        </Link>
      </div>
      <Link
        href={`/resend-verification${email ? `?email=${encodeURIComponent(email)}` : ""}`}
        className="mt-3 block text-center text-sm text-white/50 hover:text-white"
      >
        Didn&apos;t get a verification email? Resend it
      </Link>
    </AuthCard>
  );
}
