/** Build a canonical Unsplash CDN URL (sizing params are added by the image loader). */
export function unsplash(id: string): string {
  return `https://images.unsplash.com/photo-${id}`;
}

export function isUnsplash(src: string): boolean {
  return src.startsWith("https://images.unsplash.com/");
}

export function isCloudinary(src: string): boolean {
  return src.startsWith("https://res.cloudinary.com/");
}

/** A sized URL for contexts outside next/image (Open Graph tags, map popups, emails). */
export function sizedImageUrl(src: string, width: number, height?: number): string {
  if (isUnsplash(src)) {
    const url = new URL(src);
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", String(width));
    if (height) url.searchParams.set("h", String(height));
    url.searchParams.set("q", "75");
    return url.toString();
  }
  if (isCloudinary(src)) {
    const crop = height ? `,h_${height},c_fill` : ",c_limit";
    return src.replace("/upload/", `/upload/f_auto,q_auto,w_${width}${crop}/`);
  }
  return src;
}
