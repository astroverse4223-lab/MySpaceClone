import { ImageResponse } from "next/og";

// 512x512 so it satisfies the manifest's large-icon requirement for
// Android "Add to Home Screen". Content is kept inside a central safe
// zone so it survives maskable (circular) cropping.
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
          background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
          color: "white",
          fontSize: 300,
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
