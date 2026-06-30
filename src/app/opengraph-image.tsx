import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
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
              "radial-gradient(circle at 25% 20%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 45%)",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 120,
            fontWeight: 900,
            fontFamily: "Arial, sans-serif",
            color: "white",
            letterSpacing: -2,
            textShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          MySpace Reborn
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            color: "rgba(255,255,255,0.85)",
            marginTop: 24,
            fontFamily: "Arial, sans-serif",
          }}
        >
          The social network MySpace should have become.
        </div>
      </div>
    ),
    { ...size },
  );
}
