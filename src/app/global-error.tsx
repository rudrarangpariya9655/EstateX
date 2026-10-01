"use client";

import { useEffect } from "react";

/** Last-resort boundary: replaces the root layout, so it carries its own minimal document and styles. */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en-IN">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#f4f1ea", color: "#151515", fontFamily: "Georgia, serif" }}>
        <main style={{ maxWidth: 520, padding: 32 }}>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6f6d68" }}>EstateX</p>
          <h1 style={{ fontWeight: 400, fontSize: 48, lineHeight: 1, margin: "24px 0" }}>Something went wrong.</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", color: "#6f6d68", lineHeight: 1.6 }}>Please try again in a moment.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ marginTop: 24, height: 48, padding: "0 28px", background: "#151515", color: "#f4f1ea", border: 0, fontFamily: "system-ui, sans-serif", letterSpacing: "0.14em", textTransform: "uppercase", fontSize: 12, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
