import { ImageResponse } from "next/og";

// 180x180 apple-touch-icon used by iOS Safari "Add to Home Screen".
// iOS applies its own rounded-rect mask, so the artwork fills the frame.
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
          background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
          color: "white",
          fontSize: 110,
          fontWeight: 800,
          fontFamily: "Arial, sans-serif",
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
