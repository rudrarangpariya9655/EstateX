/**
 * Script that runs synchronously during HTML parsing (before first paint).
 * Rendered as text/plain on the client so React does not warn or re-run it.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
