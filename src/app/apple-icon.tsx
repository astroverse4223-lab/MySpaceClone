import { ImageResponse } from "next/og";

// 180x180 apple-touch-icon used by iOS Safari "Add to Home Screen". iOS applies
// its own rounded-rect mask, so the artwork fills the frame edge to edge.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        <div
          style={{
            display: "flex",
            fontSize: 120,
            fontWeight: 900,
            fontFamily: "Arial, sans-serif",
            color: "white",
            letterSpacing: -6,
            textShadow: "0 4px 12px rgba(0,0,0,0.35)",
          }}
        >
          M
        </div>
        <div
          style={{
            position: "absolute",
            top: 26,
            right: 32,
            width: 22,
            height: 22,
            borderRadius: 7,
            background: "white",
            transform: "rotate(45deg)",
            boxShadow: "0 0 10px rgba(255,255,255,0.8)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
