"use client";

import { Check, Plus } from "lucide-react";
import { useCompare } from "@/components/providers/compare-provider";
import { cn } from "@/lib/cn";

interface Props {
  property: { id: string; slug: string; name: string; coverUrl: string | null };
  className?: string;
  variant?: "overlay" | "inline";
}

export function CompareToggle({ property, className, variant = "overlay" }: Props) {
  const compare = useCompare();
  const active = compare.has(property.id);

  return (
    <button
      type="button"
      onClick={() => compare.toggle(property)}
      aria-pressed={active}
      className={cn(
        variant === "overlay"
          ? "inline-flex h-9 items-center gap-1.5 bg-ivory/90 px-3 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink backdrop-blur-sm transition-colors hover:bg-ivory"
          : cn(
              "inline-flex h-12 items-center gap-2.5 border px-5 label-caps transition-colors duration-300",
              active ? "border-ink bg-ink text-ivory" : "border-ink/25 hover:border-ink",
            ),
        className,
      )}
    >
      {active ? (
        <Check aria-hidden className="size-3.5" strokeWidth={1.75} />
      ) : (
        <Plus aria-hidden className="size-3.5" strokeWidth={1.75} />
      )}
      {active ? "Comparing" : "Compare"}
      <span className="sr-only"> {property.name}</span>
    </button>
  );
}
