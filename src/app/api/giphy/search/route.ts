import { NextResponse } from "next/server";

interface GiphyImage {
  url: string;
}

interface GiphyGif {
  id: string;
  title: string;
  images: {
    fixed_width_small?: GiphyImage;
    fixed_width?: GiphyImage;
    original?: GiphyImage;
  };
}

// Proxies Giphy so the API key never reaches the browser. Returns 503 when
// no key is configured so the composer can fall back to a manual paste-link.
export async function GET(request: Request) {
  const key = process.env.GIPHY_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "GIF search isn't configured yet." }, { status: 503 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const endpoint = q
    ? `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(q)}&limit=24&rating=pg-13`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=24&rating=pg-13`;

  const res = await fetch(endpoint);
  if (!res.ok) {
    return NextResponse.json({ error: "Giphy request failed" }, { status: 502 });
  }

  const json = (await res.json()) as { data?: GiphyGif[] };
  const gifs = (json.data ?? []).map((g) => ({
    id: g.id,
    title: g.title,
    preview: g.images.fixed_width_small?.url ?? g.images.fixed_width?.url ?? g.images.original?.url ?? "",
    url: g.images.fixed_width?.url ?? g.images.original?.url ?? "",
  }));

  return NextResponse.json({ gifs });
}
