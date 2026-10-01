"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Photo } from "@/components/ui/photo";
import { cn } from "@/lib/cn";

export interface LightboxImage {
  url: string;
  alt: string;
  blurDataUrl?: string | null;
}

/**
 * Fullscreen image viewer on a native modal <dialog>: arrow keys, Escape,
 * swipe gestures, visible controls and a thumbnail strip.
 */
export function Lightbox({
  images,
  index,
  open,
  title,
  onIndexChange,
  onClose,
  fit = "contain",
}: {
  images: LightboxImage[];
  index: number;
  open: boolean;
  title: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  fit?: "contain" | "plan";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const count = images.length;
  const current = images[index];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handle = () => onClose();
    dialog.addEventListener("close", handle);
    return () => dialog.removeEventListener("close", handle);
  }, [onClose]);

  // Keep the active thumbnail in view.
  useEffect(() => {
    thumbs.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  }, [index]);

  const go = (delta: number) => onIndexChange((index + delta + count) % count);

  const onPointerDown = (e: PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  return (
    <dialog
      ref={ref}
      aria-label={`${title} — image ${index + 1} of ${count}`}
      className="ex-dialog m-0 h-dvh max-h-none w-screen max-w-none bg-ink p-0 text-ivory backdrop:bg-ink"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        }
      }}
    >
      <div className="on-dark flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6">
          <p className="text-[0.8125rem] tabular-nums text-ivory/70" aria-live="polite">
            {index + 1} / {count}
          </p>
          <p className="hidden truncate px-6 font-serif text-[1.25rem] sm:block">{title}</p>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="inline-flex size-11 items-center justify-center text-ivory/80 transition-colors hover:text-ivory"
            aria-label="Close gallery"
            autoFocus
          >
            <X aria-hidden className="size-6" strokeWidth={1.25} />
          </button>
        </div>

        <div
          className="relative min-h-0 flex-1 touch-pan-y select-none"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (swipeStart.current = null)}
        >
          {current ? (
            <div className={cn("absolute inset-0", fit === "plan" ? "m-4 bg-ivory sm:m-10" : "sm:mx-20")}>
              <Photo
                key={current.url}
                src={current.url}
                alt={current.alt}
                blurDataUrl={current.blurDataUrl}
                fill
                sizes="100vw"
                quality={85}
                className={cn("animate-fade-in object-contain", fit === "plan" && "p-4 sm:p-8")}
              />
            </div>
          ) : null}
          {count > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center bg-ink/40 text-ivory backdrop-blur-sm transition-colors hover:bg-ink/70 sm:left-4"
                aria-label="Previous image"
              >
                <ChevronLeft aria-hidden className="size-6" strokeWidth={1.25} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center bg-ink/40 text-ivory backdrop-blur-sm transition-colors hover:bg-ink/70 sm:right-4"
                aria-label="Next image"
              >
                <ChevronRight aria-hidden className="size-6" strokeWidth={1.25} />
              </button>
            </>
          ) : null}
        </div>

        <div className="shrink-0 px-4 pb-4 pt-3 sm:px-6">
          <p className="mx-auto max-w-2xl text-center text-[0.875rem] leading-snug text-ivory/75">{current?.alt}</p>
          {count > 1 ? (
            <div ref={thumbs} className="no-scrollbar mt-4 hidden justify-center gap-2 overflow-x-auto sm:flex">
              {images.map((img, i) => (
                <button
                  key={img.url + i}
                  type="button"
                  data-index={i}
                  onClick={() => onIndexChange(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "relative h-14 w-20 shrink-0 overflow-hidden transition-opacity",
                    i === index ? "opacity-100 ring-1 ring-ivory" : "opacity-45 hover:opacity-80",
                  )}
                >
                  <Photo src={img.url} alt="" fill sizes="80px" className={fit === "plan" ? "bg-ivory object-contain" : "object-cover"} />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
