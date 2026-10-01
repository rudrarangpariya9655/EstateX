"use client";

import Image, { type ImageLoader, type ImageProps } from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { isCloudinary, isUnsplash } from "@/lib/images";
import { cn } from "@/lib/cn";

/** Unsplash (imgix) resizes and serves AVIF/WebP from its CDN — no need to re-optimise. */
const unsplashLoader: ImageLoader = ({ src, width, quality }) => {
  const url = new URL(src);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "max");
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 70));
  return url.toString();
};

const cloudinaryLoader: ImageLoader = ({ src, width, quality }) =>
  src.replace("/upload/", `/upload/f_auto,q_${quality ?? "auto"},w_${width},c_limit/`);

export interface PhotoProps extends Omit<ImageProps, "src" | "alt" | "placeholder" | "blurDataURL"> {
  src: string | null | undefined;
  alt: string;
  blurDataUrl?: string | null;
  /** Classes for the fallback block shown when the image cannot load. */
  fallbackClassName?: string;
}

/**
 * Image wrapper used across the site: CDN-native loaders for Unsplash and
 * Cloudinary, Next.js optimisation for everything else, blur placeholders,
 * and a calm fallback when an image fails to load.
 */
export function Photo({ src, alt, blurDataUrl, className, fallbackClassName, onError, ...props }: PhotoProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        role="img"
        aria-label={alt ? `${alt} (image unavailable)` : "Image unavailable"}
        className={cn(
          "flex size-full flex-col items-center justify-center gap-2 bg-sand text-muted",
          props.fill && "absolute inset-0",
          fallbackClassName,
        )}
      >
        <ImageOff aria-hidden className="size-5" strokeWidth={1.25} />
        <span className="eyebrow">Image unavailable</span>
      </span>
    );
  }

  const loader = isUnsplash(src) ? unsplashLoader : isCloudinary(src) ? cloudinaryLoader : undefined;
  const isSvg = src.endsWith(".svg");

  return (
    <Image
      src={src}
      alt={alt}
      loader={loader}
      unoptimized={isSvg || undefined}
      placeholder={blurDataUrl ? "blur" : "empty"}
      blurDataURL={blurDataUrl ?? undefined}
      className={className}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      {...props}
    />
  );
}
