"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { AuthCard, FormError, FormSuccess, inputClass, buttonClass } from "@/components/auth/auth-card";

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setServerError(undefined);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setServerError(json.error ?? "Something went wrong");
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <AuthCard title="Check your email" subtitle="We sent you a verification link.">
        <FormSuccess message="Click the link in your email to verify your account, then log in." />
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your page" subtitle="Join MySpace Reborn">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormError message={serverError} />
        <div>
          <input className={inputClass} placeholder="Name" {...register("name")} />
        </div>
        <div>
          <input className={inputClass} placeholder="Username" {...register("username")} />
          {errors.username && <p className="mt-1 text-xs text-red-300">{errors.username.message}</p>}
        </div>
        <div>
          <input className={inputClass} placeholder="Email" type="email" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>}
        </div>
        <div>
          <input className={inputClass} placeholder="Password" type="password" {...register("password")} />
          {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className={buttonClass}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-white/50">
        Already have an account?{" "}
        <Link href="/login" className="text-violet-400 hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
