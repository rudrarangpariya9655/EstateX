import type { Metadata } from "next";
import { env } from "./env";
import { sizedImageUrl } from "./images";

export function absoluteUrl(path = "/"): string {
  return new URL(path, env.siteUrl).toString();
}

/** Page metadata with canonical URL and Open Graph/Twitter defaults filled in. */
export function pageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  noIndex,
}: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  noIndex?: boolean;
}): Metadata {
  const images = image ? [{ url: sizedImageUrl(image, 1200, 630), width: 1200, height: 630, alt: imageAlt ?? title }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website", images },
    twitter: { card: "summary_large_image", title, description, images: images?.map((i) => i.url) },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
