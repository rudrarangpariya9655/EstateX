"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Photo } from "@/components/ui/photo";
import { cn } from "@/lib/cn";

export interface LocationTile {
  slug: string;
  name: string;
  tagline: string;
  count: number;
  image: { url: string; alt: string; blurDataUrl?: string | null };
}

/** Horizontally scrolling city collection with snap points and keyboard-accessible controls. */
export function LocationScroller({ tiles, headingId }: { tiles: LocationTile[]; headingId: string }) {
  const scroller = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const frame = window.requestAnimationFrame(measure);
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(frame);
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const scrollByTile = (direction: 1 | -1) => {
    const el = scroller.current;
    const tile = el?.querySelector("li");
    if (!el || !tile) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * (tile.getBoundingClientRect().width + 24), behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div>
      <div className="container-site mb-10 mt-10 flex justify-end gap-2 md:-mt-16 md:mb-14">
        {(
          [
            [-1, "Previous cities", ArrowLeft, edges.start],
            [1, "Next cities", ArrowRight, edges.end],
          ] as const
        ).map(([dir, label, Icon, disabled]) => (
          <button
            key={label}
            type="button"
            onClick={() => scrollByTile(dir)}
            disabled={disabled}
            aria-label={label}
            className="inline-flex size-12 items-center justify-center border border-ink/20 transition-[border-color,background-color,color,opacity] duration-300 hover:border-ink hover:bg-ink hover:text-ivory disabled:opacity-30"
          >
            <Icon aria-hidden className="size-4" strokeWidth={1.5} />
          </button>
        ))}
      </div>
      <ul
        ref={scroller}
        aria-labelledby={headingId}
        className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain scroll-smooth px-[clamp(1.25rem,0.6rem+3.2vw,4.5rem)] [scroll-padding-inline:clamp(1.25rem,0.6rem+3.2vw,4.5rem)] min-[1600px]:px-[calc((100vw-100rem)/2+4.5rem)]"
      >
        {tiles.map((tile, i) => (
          <li
            key={tile.slug}
            className="w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw] xl:w-[25vw] 3xl:w-[24rem]"
            data-reveal=""
            style={{ "--reveal-delay": Math.min(i, 3) * 90 } as CSSProperties}
          >
            <Link href={`/neighborhoods/${tile.slug}`} className="group relative block">
              <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                <Photo
                  src={tile.image.url}
                  alt={tile.image.alt}
                  blurDataUrl={tile.image.blurDataUrl}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 78vw"
                  className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.04]"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-white md:p-7">
                  <div>
                    <p className="eyebrow text-white/75">{tile.tagline}</p>
                    <h3 className="mt-2 font-serif text-[2.4rem] leading-none">{tile.name}</h3>
                    <p className="mt-3 text-[0.875rem] text-white/80">
                      {tile.count === 1 ? "1 residence" : `${tile.count} residences`}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className={cn(
                      "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-white/50 transition-[background-color,color,border-color] duration-300 group-hover:border-white group-hover:bg-white group-hover:text-ink",
                    )}
                  >
                    <ArrowRight className="size-4" strokeWidth={1.5} />
                  </span>
                </div>
              </div>
              <span className="sr-only">Explore {tile.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
