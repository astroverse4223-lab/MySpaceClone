import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-6 text-center text-xs text-white/40">
      <p>
        &copy; {new Date().getFullYear()} MySpace Reborn ·{" "}
        <Link href="/terms" className="hover:text-white/70 hover:underline">
          Terms
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" className="hover:text-white/70 hover:underline">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/dmca" className="hover:text-white/70 hover:underline">
          Copyright / DMCA
        </Link>{" "}
        ·{" "}
        <Link href="/donate" className="hover:text-white/70 hover:underline">
          Donate
        </Link>
      </p>
    </footer>
  );
}
