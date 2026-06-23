"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-white/60">Sorry about that — please try again.</p>
      <button
        onClick={reset}
        className="rounded-full bg-violet-500 px-5 py-2 text-sm font-medium hover:bg-violet-400"
      >
        Try again
      </button>
    </div>
  );
}
