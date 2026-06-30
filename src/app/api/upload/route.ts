import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { isR2Configured, uploadToR2 } from "@/lib/storage";

// Audio types intentionally excluded — profile songs use Spotify/YouTube/
// SoundCloud embeds instead of self-hosted files, to avoid hosting
// copyrighted audio ourselves. See /dmca.
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

// Images stay small; videos may be larger.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`upload:${session.user.id}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const isVideo = file.type.startsWith("video/");
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File is too large (max ${isVideo ? "50MB" : "8MB"})` },
      { status: 400 },
    );
  }

  const filename = `${session.user.id}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    // Production: store in Cloudflare R2 (persistent, survives redeploys).
    if (isR2Configured) {
      const url = await uploadToR2({
        key: `uploads/${filename}`,
        body: bytes,
        contentType: file.type,
      });
      return NextResponse.json({ url });
    }

    // Local dev fallback: write to the public/ folder so it's served by Next.
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), bytes);
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error("upload: failed to store file", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
