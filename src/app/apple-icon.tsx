import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#151515", color: "#f4f1ea", fontSize: 96, letterSpacing: -4 }}>
        E
      </div>
    ),
    size,
  );
}
