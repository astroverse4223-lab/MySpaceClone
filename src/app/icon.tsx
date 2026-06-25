import { ImageResponse } from "next/og";

// 512x512 so it satisfies the manifest's large-icon requirement for Android
// "Add to Home Screen". Artwork is kept inside a central safe zone so it
// survives maskable (circular) cropping. This is also the browser-tab favicon
// (there's intentionally no favicon.ico, so this generated icon wins).
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background:
            "linear-gradient(135deg, #6d28d9 0%, #a21caf 45%, #ec4899 100%)",
        }}
      >
        {/* Soft top-left highlight for a glossy, dimensional feel. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 45%)",
          }}
        />
        {/* The M. Heavy weight + tight tracking reads well even at 16px. */}
        <div
          style={{
            display: "flex",
            fontSize: 340,
            fontWeight: 900,
            fontFamily: "Arial, sans-serif",
            color: "white",
            letterSpacing: -16,
            textShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          M
        </div>
        {/* Sparkle accent (CSS-drawn so it never depends on a glyph font). */}
        <div
          style={{
            position: "absolute",
            top: 78,
            right: 92,
            width: 60,
            height: 60,
            borderRadius: 18,
            background: "white",
            transform: "rotate(45deg)",
            boxShadow: "0 0 24px rgba(255,255,255,0.8)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
