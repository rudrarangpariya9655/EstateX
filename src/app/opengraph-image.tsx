import { ImageResponse } from "next/og";

export const alt = "EstateX — Exceptional homes, thoughtfully discovered";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social card: typographic, in the EstateX palette. Property pages use their cover photograph instead. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f4f1ea",
          color: "#151515",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 8 }}>ESTATEX</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, lineHeight: 1, letterSpacing: -3 }}>Exceptional homes.</div>
          <div style={{ fontSize: 92, lineHeight: 1.05, letterSpacing: -3, color: "#24392c" }}>Thoughtfully discovered.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#6f6d68", borderTop: "2px solid #d9d5cd", paddingTop: 28 }}>
          <span>Ahmedabad · Mumbai · Bengaluru · Goa · Pune · Delhi</span>
          <span>Portfolio demonstration</span>
        </div>
      </div>
    ),
    size,
  );
}
