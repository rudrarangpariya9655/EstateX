import "server-only";
import placeholders from "./data/blur-placeholders.json";

const BLUR: Record<string, string> = placeholders;

/** Blur placeholder for a known Unsplash image (server-side only, keeps client bundles small). */
export function blurFor(url: string | null | undefined): string | null {
  const id = url?.match(/photo-(\d{10,13}-[0-9a-f]{12})/)?.[1];
  return (id && BLUR[id]) || null;
}

/** Attach a blur placeholder to an image descriptor. */
export function withBlur<T extends { url: string }>(image: T): T & { blurDataUrl: string | null } {
  return { ...image, blurDataUrl: blurFor(image.url) };
}
