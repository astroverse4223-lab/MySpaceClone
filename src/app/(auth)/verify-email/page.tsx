"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard, FormError, FormSuccess } from "@/components/auth/auth-card";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Missing verification token.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setStatus("error");
          setError(json.error ?? "Verification failed.");
          return;
        }
        setStatus("success");
      })
      .catch(() => {
        setStatus("error");
        setError("Verification failed.");
      });
  }, [token]);

  return (
    <AuthCard title="Email verification">
      {status === "loading" && <p className="text-sm text-white/60">Verifying your email...</p>}
      {status === "success" && (
        <>
          <FormSuccess message="Your email has been verified." />
          <Link href="/login" className="mt-4 block text-center text-sm text-violet-400 hover:underline">
            Continue to log in
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <FormError message={error} />
          <Link
            href="/resend-verification"
            className="mt-4 block text-center text-sm text-violet-400 hover:underline"
          >
            Resend verification link
          </Link>
        </>
      )}
    </AuthCard>
  );
}
