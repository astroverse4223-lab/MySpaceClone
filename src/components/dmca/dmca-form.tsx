"use client";

import { useState } from "react";

const CONTENT_TYPES = [
  { value: "PROFILE_SONG", label: "Profile song" },
  { value: "PLAYLIST_TRACK", label: "Playlist track" },
  { value: "POST", label: "Post / image / video" },
  { value: "OTHER", label: "Other" },
];

export function DmcaForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      complainantName: String(form.get("complainantName") ?? ""),
      complainantEmail: String(form.get("complainantEmail") ?? ""),
      contentType: String(form.get("contentType") ?? ""),
      contentUrl: String(form.get("contentUrl") ?? ""),
      targetUsername: String(form.get("targetUsername") ?? "") || undefined,
      description: String(form.get("description") ?? ""),
      goodFaithStatement: form.get("goodFaithStatement") === "on",
      accuracyStatement: form.get("accuracyStatement") === "on",
      signature: String(form.get("signature") ?? ""),
    };

    const res = await fetch("/api/dmca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-sm text-emerald-200">
        Your notice has been received. We&apos;ll review it and respond to the email address you provided.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-white/60">Your name</label>
          <input
            name="complainantName"
            required
            maxLength={200}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/60">Your email</label>
          <input
            type="email"
            name="complainantEmail"
            required
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-white/60">Type of content</label>
          <select
            name="contentType"
            required
            defaultValue=""
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
          >
            <option value="" disabled>
              Choose one
            </option>
            {CONTENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/60">Username of the profile (if known)</label>
          <input
            name="targetUsername"
            maxLength={50}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-white/60">Link to the infringing content</label>
        <input
          name="contentUrl"
          required
          maxLength={2000}
          placeholder="https://myspaceclone.online/profile/..."
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-white/60">
          Describe the copyrighted work and why this use infringes it
        </label>
        <textarea
          name="description"
          required
          minLength={20}
          maxLength={2000}
          rows={4}
          className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
        />
      </div>

      <div className="space-y-2 text-xs text-white/60">
        <label className="flex items-start gap-2">
          <input type="checkbox" name="goodFaithStatement" required className="mt-0.5" />
          I have a good faith belief that use of the material in the manner complained of is not authorized by
          the copyright owner, its agent, or the law.
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="accuracyStatement" required className="mt-0.5" />
          The information in this notice is accurate, and under penalty of perjury, I am the copyright owner or
          am authorized to act on the owner&apos;s behalf.
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm text-white/60">Electronic signature (type your full legal name)</label>
        <input
          name="signature"
          required
          minLength={2}
          maxLength={200}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
        />
      </div>

      {error && <p className="text-xs text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium hover:bg-violet-400 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit notice"}
      </button>
    </form>
  );
}
