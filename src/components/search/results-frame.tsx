"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useSearch } from "./search-context";

/** Keeps current results visible but quieted while the next results stream in. */
export function ResultsFrame({ children }: { children: ReactNode }) {
  const { pending } = useSearch();
  return (
    <div
      aria-busy={pending}
      className={cn("transition-opacity duration-300", pending && "pointer-events-none opacity-45")}
    >
      {pending ? (
        <p role="status" className="sr-only">
          Updating results…
        </p>
      ) : null}
      {children}
    </div>
  );
}
