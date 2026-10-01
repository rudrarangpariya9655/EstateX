"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { GraduationCap, Hospital, ShoppingBag, TrainFront, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { PropertyMap } from "@/components/map/property-map";
import { NEARBY_LABELS } from "@/lib/constants";
import { formatDistance } from "@/lib/format";
import { NEARBY_CATEGORIES, type NearbyCategory, type Property } from "@/lib/types";
import { cn } from "@/lib/cn";

const ICONS: Record<NearbyCategory, LucideIcon> = {
  schools: GraduationCap,
  healthcare: Hospital,
  dining: UtensilsCrossed,
  shopping: ShoppingBag,
  transit: TrainFront,
};

export function Neighborhood({ property, cityLabel }: { property: Property; cityLabel: string }) {
  const id = useId();
  const categories = NEARBY_CATEGORIES.filter((c) => property.nearby.some((n) => n.category === c));
  const [active, setActive] = useState<NearbyCategory | undefined>(categories[0]);
  const points = useMemo(
    () => [
      {
        id: property.id,
        slug: property.slug,
        name: property.name,
        locality: property.locality,
        city: property.city,
        price: property.price,
        latitude: property.latitude,
        longitude: property.longitude,
        coverUrl: property.cover?.url ?? null,
      },
    ],
    [property],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta || !active) return;
    event.preventDefault();
    const next = categories[(categories.indexOf(active) + delta + categories.length) % categories.length]!;
    setActive(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  const places = property.nearby.filter((n) => n.category === active).sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
      <div className="min-w-0 lg:col-span-7">
        <PropertyMap
          points={points}
          variant="single"
          label={`Map showing the approximate location of ${property.name} in ${property.locality}, ${cityLabel}`}
          className="aspect-[4/3] w-full"
        />
        <p className="mt-4 text-[0.8125rem] text-muted">
          Approximate location in {property.locality}. The exact address is shared when a visit is arranged.
        </p>
      </div>

      <div className="min-w-0 lg:col-span-5">
        {categories.length && active ? (
          <>
            <div role="tablist" aria-label="Nearby places" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b border-line px-1">
              {categories.map((cat) => {
                const Icon = ICONS[cat];
                return (
                  <button
                    key={cat}
                    id={`${id}-tab-${cat}`}
                    role="tab"
                    type="button"
                    aria-selected={cat === active}
                    aria-controls={`${id}-panel`}
                    tabIndex={cat === active ? 0 : -1}
                    onClick={() => setActive(cat)}
                    onKeyDown={onKeyDown}
                    className={cn(
                      "-mb-px inline-flex min-h-12 shrink-0 items-center gap-2 border-b px-3 text-[0.875rem] transition-colors",
                      cat === active ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink",
                    )}
                  >
                    <Icon aria-hidden className="size-4" strokeWidth={1.4} />
                    {NEARBY_LABELS[cat]}
                  </button>
                );
              })}
            </div>
            <ul id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`} className="mt-2">
              {places.map((place) => (
                <li key={place.name} className="flex items-baseline justify-between gap-6 border-b border-line py-5">
                  <span className="text-[0.9375rem]">{place.name}</span>
                  <span className="shrink-0 text-[0.875rem] tabular-nums text-muted">{formatDistance(place.distanceKm)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 border-l-2 border-line pl-4 text-[0.8125rem] leading-relaxed text-muted">
              Illustrative demo data. Place types and distances are indicative and not verified; airport distances are
              straight-line estimates.
            </p>
          </>
        ) : (
          <p className="text-[0.9375rem] leading-relaxed text-muted">
            Neighborhood details for this residence haven&apos;t been added yet. Your advisor can walk you through the
            area during a visit.
          </p>
        )}
      </div>
    </div>
  );
}
