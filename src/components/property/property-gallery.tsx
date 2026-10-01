"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Images } from "lucide-react";
import { Photo } from "@/components/ui/photo";
import type { PropertyImage } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Lightbox } from "./lightbox";

// Shared by the phone carousel and the desktop lead image so both preloads resolve to one request.
const GALLERY_LEAD_SIZES = "(min-width: 1600px) 1450px, 100vw";

/**
 * Editorial gallery: one cinematic lead image, then an asymmetric pair.
 * Phones get a swipeable carousel. Everything opens the fullscreen lightbox.
 */
export function PropertyGallery({ images, name }: { images: PropertyImage[]; name: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [slide, setSlide] = useState(0);
  const carousel = useRef<HTMLDivElement>(null);

  const show = (i: number) => {
    setIndex(i);
    setOpen(true);
  };
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const el = carousel.current;
    if (!el) return;
    const onScroll = () => setSlide(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (!images.length) {
    return <div className="aspect-[16/9] w-full bg-sand" role="img" aria-label={`${name} — photographs coming soon`} />;
  }

  const [lead, second, third] = images;

  return (
    <>
      {/* Phones and small tablets: swipeable carousel. */}
      <div className="relative md:hidden">
        <div
          ref={carousel}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          aria-label={`${name} photographs`}
          role="region"
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => show(i)}
              className="relative aspect-[4/3] w-full shrink-0 snap-center bg-sand"
              aria-label={`Open photo ${i + 1} of ${images.length}: ${img.alt}`}
            >
              <Photo
                src={img.url}
                alt=""
                blurDataUrl={img.blurDataUrl}
                fill
                sizes={GALLERY_LEAD_SIZES}
                preload={i === 0}
                className="object-cover"
              />
            </button>
          ))}
        </div>
        <span className="pointer-events-none absolute bottom-4 right-4 bg-ink/60 px-3 py-1.5 text-[0.75rem] tabular-nums text-ivory backdrop-blur-sm">
          {Math.min(slide + 1, images.length)} / {images.length}
        </span>
      </div>

      {/* Tablet and desktop: lead image + asymmetric pair. */}
      <div className="hidden md:block">
        {lead ? (
          <button
            type="button"
            onClick={() => show(0)}
            className="group relative block aspect-[16/9] w-full overflow-hidden bg-sand xl:aspect-[2.1/1]"
            aria-label={`Open photo 1 of ${images.length}: ${lead.alt}`}
          >
            <Photo
              src={lead.url}
              alt=""
              blurDataUrl={lead.blurDataUrl}
              fill
              preload
              fetchPriority="high"
              sizes={GALLERY_LEAD_SIZES}
              className="object-cover transition-transform duration-[1600ms] ease-out-expo group-hover:scale-[1.02]"
            />
          </button>
        ) : null}
        {second ? (
          <div className="mt-4 grid grid-cols-12 gap-4 lg:mt-6 lg:gap-6">
            {[second, third].map((img, i) =>
              img ? (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => show(i + 1)}
                  className={cn(
                    "group relative h-[clamp(16rem,30vw,32rem)] overflow-hidden bg-sand",
                    i === 0 ? "col-span-7" : "col-span-5",
                    !third && "col-span-12",
                  )}
                  aria-label={`Open photo ${i + 2} of ${images.length}: ${img.alt}`}
                >
                  <Photo
                    src={img.url}
                    alt=""
                    blurDataUrl={img.blurDataUrl}
                    fill
                    sizes={i === 0 ? "55vw" : "40vw"}
                    className="object-cover transition-transform duration-[1600ms] ease-out-expo group-hover:scale-[1.03]"
                  />
                </button>
              ) : null,
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={() => show(0)}
          className="inline-flex min-h-11 items-center gap-2.5 border-b border-ink/30 pb-1 label-caps transition-colors hover:border-ink"
        >
          <Images aria-hidden className="size-4" strokeWidth={1.4} />
          View all {images.length} photos
        </button>
      </div>

      <Lightbox
        images={images}
        index={index}
        open={open}
        title={name}
        onIndexChange={setIndex}
        onClose={close}
      />
    </>
  );
}
