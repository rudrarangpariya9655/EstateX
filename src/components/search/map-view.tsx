"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { PropertyMap, type MapPoint } from "@/components/map/property-map";
import { Photo } from "@/components/ui/photo";
import { PROPERTY_TYPE_LABELS, cityName } from "@/lib/constants";
import { formatPrice, formatSpecs } from "@/lib/format";
import type { PropertySummary } from "@/lib/types";
import { cn } from "@/lib/cn";
import { StatusLabel } from "@/components/property/status-label";

export function MapView({ properties }: { properties: PropertySummary[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const points = useMemo<MapPoint[]>(
    () =>
      properties.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        locality: p.locality,
        city: p.city,
        price: p.price,
        latitude: p.latitude,
        longitude: p.longitude,
        coverUrl: p.cover?.url ?? null,
      })),
    [properties],
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
      <div className="order-2 min-w-0 lg:order-1">
        <ul className="divide-y divide-line border-y border-line">
          {properties.map((p) => {
            const selected = p.id === selectedId;
            return (
              <li key={p.id} className={cn("transition-colors", selected && "bg-surface")}>
                <div className="flex gap-5 py-5 pl-0 pr-2 sm:pl-3">
                  <Link
                    href={`/properties/${p.slug}`}
                    tabIndex={-1}
                    aria-hidden
                    className="relative block aspect-[4/3] w-28 shrink-0 overflow-hidden bg-sand sm:w-36"
                  >
                    <Photo src={p.cover?.url} alt="" blurDataUrl={p.cover?.blurDataUrl} fill sizes="144px" className="object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <p className="eyebrow truncate text-muted">{PROPERTY_TYPE_LABELS[p.type]}</p>
                      <StatusLabel status={p.status} className="hidden shrink-0 sm:inline-flex" />
                    </div>
                    <h2 className="mt-1.5 font-serif text-[1.4rem] leading-tight">
                      <Link href={`/properties/${p.slug}`} className="hit-area hover:underline hover:decoration-1 hover:underline-offset-4">
                        {p.name}
                      </Link>
                    </h2>
                    <p className="mt-1 truncate text-[0.8125rem] text-muted">
                      {p.locality}, {cityName(p.city)}
                    </p>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pt-3">
                      <div className="min-w-0">
                        <p className="text-[0.9375rem] font-medium tabular-nums">{formatPrice(p.price)}</p>
                        <p className="text-[0.75rem] text-muted">{formatSpecs(p)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedId(p.id)}
                        aria-pressed={selected}
                        className={cn(
                          "inline-flex min-h-10 items-center gap-1.5 text-[0.75rem] font-medium uppercase tracking-[0.12em] transition-colors",
                          selected ? "text-accent" : "text-ink/70 hover:text-ink",
                        )}
                      >
                        <MapPin aria-hidden className="size-3.5" strokeWidth={1.5} />
                        {selected ? "Shown on map" : "Show on map"}
                        <span className="sr-only"> — {p.name}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 flex items-center gap-2 text-[0.8125rem] text-muted">
          <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.5} />
          Select a marker for a preview. Locations are approximate.
        </p>
      </div>
      <div className="order-1 min-w-0 lg:order-2">
        <div className="h-[58vh] min-h-[22rem] lg:sticky lg:top-[9.5rem] lg:h-[calc(100dvh-11rem)]">
          <PropertyMap
            points={points}
            selectedId={selectedId}
            onSelect={setSelectedId}
            label={`Map of ${properties.length} residences`}
            className="size-full"
          />
        </div>
      </div>
    </div>
  );
}
