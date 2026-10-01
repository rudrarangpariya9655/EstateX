"use client";

import { ArrowUp } from "lucide-react";

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
        document.getElementById("main")?.focus({ preventScroll: true });
      }}
      className="group inline-flex min-h-11 items-center gap-2 self-start label-caps text-[0.7rem] text-ivory/80 transition-colors hover:text-ivory md:self-auto"
    >
      Back to top
      <ArrowUp aria-hidden className="size-4 transition-transform duration-300 group-hover:-translate-y-1" strokeWidth={1.5} />
    </button>
  );
}
