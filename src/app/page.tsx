import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

const FEATURES = [
  { emoji: "🎨", title: "Truly your page", body: "Themes, fonts, accent colors, a profile song and a background — make a page that actually looks like you." },
  { emoji: "📖", title: "Guestbooks are back", body: "Friends sign your wall. Set your mood. It's the social web that felt personal." },
  { emoji: "🫂", title: "Top Friends", body: "Curate your inner circle and rank your people. Yes, the drama is a feature." },
  { emoji: "🔔", title: "Live notifications", body: "Reactions, comments, friend requests and profile visitors — know the moment it happens." },
  { emoji: "🏅", title: "Badges & milestones", body: "Earn badges as you post, befriend, create and explore. Show them off on your page." },
  { emoji: "🎧", title: "Music & communities", body: "Build playlists, start communities, write a blog, host events. Your whole world, one home." },
];

const STATS = [
  { value: "8", label: "Top Friends slots" },
  { value: "8", label: "Page themes" },
  { value: "9", label: "Collectible badges" },
  { value: "∞", label: "Ways to be you" },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/feed");
  }

  return (
    <div className="relative overflow-hidden">
      {/* Animated backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-float-blob absolute -left-20 top-0 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="animate-float-blob absolute right-0 top-40 h-96 w-96 rounded-full bg-pink-600/25 blur-3xl [animation-delay:-6s]" />
        <div className="animate-float-blob absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl [animation-delay:-12s]" />
      </div>

      {/* Hero */}
      <section className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pb-20 pt-28 text-center">
        <span className="animate-fade-up mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-white/70 backdrop-blur">
          ✨ The internet, but yours again
        </span>
        <h1 className="animate-fade-up text-5xl font-bold tracking-tight [animation-delay:0.1s] sm:text-7xl">
          Your page.
          <br />
          Your rules.
          <br />
          <span className="text-gradient-animated">Reborn for 2026.</span>
        </h1>
        <p className="animate-fade-up mt-6 max-w-xl text-lg text-white/60 [animation-delay:0.2s]">
          A wildly customizable profile, real friendships, guestbooks, moods and communities that feel like home —
          without an algorithm deciding who you are.
        </p>
        <div className="animate-fade-up mt-10 flex flex-wrap justify-center gap-4 [animation-delay:0.3s]">
          <Link
            href="/register"
            className="gradient-accent rounded-full px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:scale-105"
          >
            Create your page →
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/15 px-7 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            Log in
          </Link>
        </div>

        {/* Stats */}
        <div className="animate-fade-up mt-16 grid w-full max-w-2xl grid-cols-2 gap-4 [animation-delay:0.4s] sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="glass rounded-2xl px-4 py-5">
              <div className="text-3xl font-bold text-gradient-animated">{s.value}</div>
              <div className="mt-1 text-xs text-white/50">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative mx-auto max-w-5xl px-6 pb-28">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Everything social media <span className="text-gradient-animated">forgot to be fun</span>
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass group rounded-2xl p-6 transition hover:-translate-y-1 hover:border-white/20"
            >
              <div className="text-3xl transition group-hover:scale-110">{f.emoji}</div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-white/55">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-3xl px-6 pb-32">
        <div className="glass relative overflow-hidden rounded-3xl p-10 text-center">
          <div className="gradient-accent pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight">Claim your corner of the internet</h2>
            <p className="mx-auto mt-3 max-w-md text-white/60">
              Free forever. Set up your page in under a minute. Bring your friends.
            </p>
            <Link
              href="/register"
              className="gradient-accent mt-8 inline-block rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:scale-105"
            >
              Get started — it&apos;s free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
