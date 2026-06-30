export type MusicEmbedProvider = "spotify" | "youtube" | "soundcloud";

export interface MusicEmbed {
  provider: MusicEmbedProvider;
  embedSrc: string;
  height: number;
}

// Only these three providers are accepted for a profile song. They stream the
// track from their own licensed catalog via an official embed widget, so we
// never host or hotlink the copyrighted audio file ourselves. See /dmca.
export function parseMusicEmbed(rawUrl: string): MusicEmbed | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "open.spotify.com") {
    const match = url.pathname.match(
      /\/(?:intl-[a-z]{2}(?:-[A-Z]{2})?\/)?(track|album|playlist|episode)\/([a-zA-Z0-9]+)/,
    );
    if (!match) return null;
    return {
      provider: "spotify",
      embedSrc: `https://open.spotify.com/embed/${match[1]}/${match[2]}`,
      height: 152,
    };
  }

  if (host === "youtube.com" || host === "music.youtube.com" || host === "youtu.be") {
    const videoId = host === "youtu.be" ? url.pathname.slice(1).split("/")[0] : url.searchParams.get("v");
    if (!videoId) return null;
    return {
      provider: "youtube",
      embedSrc: `https://www.youtube.com/embed/${videoId}`,
      height: 200,
    };
  }

  if (host === "soundcloud.com") {
    return {
      provider: "soundcloud",
      embedSrc: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.toString())}&color=%23a259ff&auto_play=false&show_artwork=true`,
      height: 166,
    };
  }

  return null;
}
