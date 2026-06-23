import Link from "next/link";
import { RICH_TOKEN_RE } from "@/lib/text";

/**
 * Renders text with @mentions linking to profiles and #hashtags linking to
 * Explore. Safe in both server and client components (no hooks). Wrap in an
 * element with `whitespace-pre-wrap` to preserve line breaks.
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(RICH_TOKEN_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          return (
            <Link key={i} href={`/profile/${part.slice(1)}`} className="text-accent font-medium hover:underline">
              {part}
            </Link>
          );
        }
        if (part.startsWith("#")) {
          return (
            <Link
              key={i}
              href={`/tags/${encodeURIComponent(part.slice(1).toLowerCase())}`}
              className="text-accent font-medium hover:underline"
            >
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
