"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Subtle vertical parallax for full-bleed imagery. The layer is slightly taller
 * than its frame so movement never reveals an edge. Updates are throttled to
 * animation frames, run only while the frame is on screen, and are disabled
 * under prefers-reduced-motion.
 */
export function Parallax({
  children,
  speed = 0.12,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    const frameEl = layer?.parentElement;
    if (!layer || !frameEl) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let visible = false;
    const update = () => {
      frame = 0;
      const rect = frameEl.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
      layer.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };
    const schedule = () => {
      if (visible && !frame) frame = window.requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      schedule();
    });
    io.observe(frameEl);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [speed]);

  return (
    <div ref={ref} className={cn("absolute inset-x-0 -inset-y-[10%] will-change-transform", className)}>
      {children}
    </div>
  );
}
