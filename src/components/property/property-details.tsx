import { AmenityIcon } from "@/components/ui/amenity-icon";
import { AMENITY_BY_SLUG, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import type { Agent, Property } from "@/lib/types";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

export function SectionHeading({ eyebrow, title, id, className }: { eyebrow: string; title: string; id: string; className?: string }) {
  return (
    <div className={className}>
      <p className="eyebrow text-muted" data-reveal="">
        {eyebrow}
      </p>
      <h2 id={id} className="mt-5 text-h2" data-reveal="" style={{ ["--reveal-delay" as string]: 80 }}>
        {title}
      </h2>
    </div>
  );
}

/** Typographic specification columns with hairline separators — no boxes. */
export function Specifications({ property }: { property: Property }) {
  const specs = [
    { label: "Bedrooms", value: String(property.bedrooms) },
    { label: "Bathrooms", value: String(property.bathrooms) },
    { label: "Area", value: formatNumber(property.areaSqft), unit: "sq.ft." },
    { label: "Year built", value: property.yearBuilt ? String(property.yearBuilt) : "—" },
    { label: "Parking", value: String(property.parking), unit: property.parking === 1 ? "space" : "spaces" },
    { label: "Type", value: PROPERTY_TYPE_LABELS[property.type] },
  ];
  return (
    <dl className="grid grid-cols-2 border-t border-line sm:grid-cols-3 xl:grid-cols-6">
      {specs.map((spec, i) => (
        <div
          key={spec.label}
          data-reveal=""
          style={{ ["--reveal-delay" as string]: i * 60 }}
          className={cn(
            "flex flex-col gap-3 border-b border-line py-7 pr-4 xl:border-b-0 xl:py-9",
            i % 2 === 1 && "max-sm:border-l max-sm:pl-5",
            i % 3 !== 0 && "sm:max-xl:border-l sm:max-xl:pl-6",
            i !== 0 && "xl:border-l xl:pl-6",
          )}
        >
          <dt className="eyebrow text-muted">{spec.label}</dt>
          <dd className="font-serif text-[2rem] leading-none md:text-[2.4rem]">
            {spec.value}
            {spec.unit ? <span className="ml-2 font-sans text-[0.8125rem] text-muted">{spec.unit}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Amenities: the first eight are shown; the rest sit behind a native disclosure. */
export function Amenities({ amenities }: { amenities: string[] }) {
  const items = amenities.map((slug) => AMENITY_BY_SLUG[slug]).filter(Boolean);
  const first = items.slice(0, 8);
  const rest = items.slice(8);
  const row = (item: (typeof items)[number]) => (
    <li key={item!.slug} className="flex min-h-14 items-center gap-4 border-b border-line text-[0.9375rem]">
      <AmenityIcon icon={item!.icon} className="size-5 shrink-0 text-muted" />
      {item!.label}
    </li>
  );
  if (!items.length) return <p className="text-muted">Amenity details will be added soon.</p>;
  return (
    <div>
      <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2 lg:grid-cols-3">{first.map(row)}</ul>
      {rest.length ? (
        <details className="group mt-2">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-[0.875rem] underline underline-offset-4 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Show all {items.length} amenities</span>
            <span className="hidden group-open:inline">Show fewer</span>
          </summary>
          <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2 lg:grid-cols-3">{rest.map(row)}</ul>
        </details>
      ) : null}
    </div>
  );
}

export function AgentProfile({ agent }: { agent: Agent }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-5">
        <span
          aria-hidden
          className="inline-flex size-20 shrink-0 items-center justify-center rounded-full bg-accent font-serif text-[1.75rem] text-ivory"
        >
          {initials(agent.name)}
        </span>
        <div>
          <p className="font-serif text-[1.75rem] leading-tight">{agent.name}</p>
          <p className="mt-1 text-[0.875rem] text-muted">{agent.title}</p>
        </div>
      </div>
      <p className="max-w-md text-[0.9375rem] leading-relaxed text-muted">{agent.bio}</p>
      <p className="text-[0.8125rem] text-muted">
        <span className="eyebrow mr-3 text-ink">Speaks</span>
        {agent.languages.join(" · ")}
      </p>
    </div>
  );
}
