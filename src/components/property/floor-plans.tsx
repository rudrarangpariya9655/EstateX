"use client";

import { useCallback, useId, useState, type KeyboardEvent } from "react";
import { Maximize2 } from "lucide-react";
import { Photo } from "@/components/ui/photo";
import type { FloorPlan } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Lightbox } from "./lightbox";

/** Floor plans with accessible tabs (when there is more than one) and a click-to-enlarge viewer. */
export function FloorPlans({ plans, name }: { plans: FloorPlan[]; name: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const id = useId();
  const close = useCallback(() => setOpen(false), []);
  const plan = plans[active];

  if (!plan) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = (active + keys[event.key]! + plans.length) % plans.length;
    setActive(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  return (
    <div>
      {plans.length > 1 ? (
        <div role="tablist" aria-label="Floors" className="flex gap-8 border-b border-line">
          {plans.map((p, i) => (
            <button
              key={p.id}
              id={`${id}-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={i === active}
              aria-controls={`${id}-panel`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={onKeyDown}
              className={cn(
                "-mb-px min-h-12 border-b pb-3 pt-2 text-[0.875rem] transition-colors",
                i === active ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        id={`${id}-panel`}
        role={plans.length > 1 ? "tabpanel" : undefined}
        aria-labelledby={plans.length > 1 ? `${id}-tab-${active}` : undefined}
        className="mt-8"
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative block aspect-[4/3] w-full overflow-hidden border border-line bg-surface"
          aria-label={`Enlarge ${plan.label} plan`}
        >
          <Photo
            key={plan.url}
            src={plan.url}
            alt={`${plan.label} floor plan of ${name}`}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="animate-fade-in object-contain p-6 transition-transform duration-700 ease-out-expo group-hover:scale-[1.02] sm:p-10"
          />
          <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 bg-ink px-3 py-2 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ivory">
            <Maximize2 aria-hidden className="size-3.5" strokeWidth={1.5} /> Enlarge
          </span>
        </button>
        <p className="mt-4 text-[0.8125rem] text-muted">Plans are indicative; dimensions are approximate.</p>
      </div>

      <Lightbox
        images={plans.map((p) => ({ url: p.url, alt: `${p.label} floor plan of ${name}` }))}
        index={active}
        open={open}
        title={`${name} — floor plans`}
        onIndexChange={setActive}
        onClose={close}
        fit="plan"
      />
    </div>
  );
}
