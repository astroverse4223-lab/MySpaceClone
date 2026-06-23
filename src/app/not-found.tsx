import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-sm text-white/60">This page doesn&apos;t exist or may have been removed.</p>
      <Link href="/" className="rounded-full bg-violet-500 px-5 py-2 text-sm font-medium hover:bg-violet-400">
        Back home
      </Link>
    </div>
  );
}
