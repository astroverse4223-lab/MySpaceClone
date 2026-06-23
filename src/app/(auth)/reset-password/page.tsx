"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthCard, FormError, FormSuccess, inputClass, buttonClass } from "@/components/auth/auth-card";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (!token) {
    return (
      <AuthCard title="Reset your password">
        <FormError message="Missing reset token. Use the link from your email." />
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password">
      {success ? (
        <FormSuccess message="Password updated. Redirecting to log in..." />
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <FormError message={error} />
          <input
            className={inputClass}
            placeholder="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
