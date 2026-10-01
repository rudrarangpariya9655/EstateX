import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Photo } from "@/components/ui/photo";
import { PROPERTY_TYPE_LABELS, cityName } from "@/lib/constants";
import { formatPrice, formatSpecs } from "@/lib/format";
import type { PropertySummary } from "@/lib/types";
import { cn } from "@/lib/cn";
import { CompareToggle } from "./compare-toggle";
import { FavoriteButton } from "./favorite-button";
import { StatusLabel } from "./status-label";

export const GRID_SIZES = "(min-width: 1280px) 31vw, (min-width: 768px) 46vw, 100vw";

/**
 * Property card: photography first, minimal chrome. On hover-capable devices the
 * image eases in slightly and "View property" replaces the arrow-less metadata.
 */
export function PropertyCard({
  property,
  sizes = GRID_SIZES,
  aspect = "aspect-[4/5]",
  className,
  preload,
  headingLevel = "h3",
}: {
  property: PropertySummary;
  sizes?: string;
  aspect?: string;
  className?: string;
  preload?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const href = `/properties/${property.slug}`;
  const Heading = headingLevel;
  return (
    <article className={cn("group relative", className)}>
      <div className={cn("relative overflow-hidden bg-sand", aspect)}>
        <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0">
          <Photo
            src={property.cover?.url}
            alt={property.cover?.alt ?? ""}
            blurDataUrl={property.cover?.blurDataUrl}
            fill
            sizes={sizes}
            preload={preload}
            className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.03]"
          />
        </Link>
        <FavoriteButton propertyId={property.id} name={property.name} className="absolute right-4 top-4" />
        <div className="absolute left-4 top-4 hidden opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:block">
          <CompareToggle
            property={{ id: property.id, slug: property.slug, name: property.name, coverUrl: property.cover?.url ?? null }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow truncate text-muted">
            {PROPERTY_TYPE_LABELS[property.type]} · {property.locality}, {cityName(property.city)}
          </p>
          <Heading className="mt-2.5 font-serif text-[1.75rem] leading-[1.05] tracking-[-0.01em]">
            <Link href={href} className="outline-offset-4">
              {property.name}
            </Link>
          </Heading>
        </div>
        <StatusLabel status={property.status} className="mt-px shrink-0" />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4 border-t border-line pt-4">
        <div className="min-w-0">
          <p className="text-[1.0625rem] font-medium tabular-nums">{formatPrice(property.price)}</p>
          <p className="mt-1 truncate text-[0.8125rem] text-muted">{formatSpecs(property)}</p>
        </div>
        <span
          aria-hidden
          className="hidden shrink-0 -translate-x-2 items-center gap-2 pb-0.5 label-caps text-[0.68rem] opacity-0 transition-[opacity,transform] duration-500 ease-out-expo group-hover:translate-x-0 group-hover:opacity-100 [@media(hover:hover)]:inline-flex"
        >
          View property <ArrowRight className="size-3.5" strokeWidth={1.5} />
        </span>
      </div>
    </article>
  );
}

export function PropertyCardSkeleton({ aspect = "aspect-[4/5]" }: { aspect?: string }) {
  return (
    <div aria-hidden>
      <div className={cn("skeleton", aspect)} />
      <div className="mt-5 h-3 w-1/2 skeleton" />
      <div className="mt-3 h-7 w-3/4 skeleton" />
      <div className="mt-4 border-t border-line pt-4">
        <div className="h-4 w-1/4 skeleton" />
        <div className="mt-2 h-3 w-2/3 skeleton" />
      </div>
    </div>
  );
}
