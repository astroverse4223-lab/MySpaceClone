export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-white/60">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {message}
    </p>
  );
}

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
      {message}
    </p>
  );
}

export const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/60 focus:ring-1 focus:ring-violet-400/60";

export const buttonClass =
  "w-full rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50";
