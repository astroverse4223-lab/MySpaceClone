/** Shared mention/hashtag parsing used for rendering and notifications. */

const MENTION_RE = /@([a-zA-Z0-9_]{2,30})/g;
const HASHTAG_RE = /#([a-zA-Z0-9_]{1,50})/g;

/** Token splitter that keeps @mentions and #hashtags as their own pieces. */
export const RICH_TOKEN_RE = /(@[a-zA-Z0-9_]{2,30}|#[a-zA-Z0-9_]{1,50})/g;

export function extractMentions(text: string | null | undefined): string[] {
  if (!text) return [];
  const found = new Set<string>();
  for (const m of text.matchAll(MENTION_RE)) found.add(m[1]);
  return [...found];
}

export function extractHashtags(text: string | null | undefined): string[] {
  if (!text) return [];
  const found = new Set<string>();
  for (const m of text.matchAll(HASHTAG_RE)) found.add(m[1].toLowerCase());
  return [...found];
}
