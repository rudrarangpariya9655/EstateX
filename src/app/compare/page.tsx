import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CompareFromDevice, RemoveFromCompare, SyncCompare } from "@/components/compare/compare-client";
import { StatusLabel } from "@/components/property/status-label";
import { AmenityIcon } from "@/components/ui/amenity-icon";
import { ArrowLink, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Photo } from "@/components/ui/photo";
import { AMENITY_BY_SLUG, DEMO_NOTICE, MAX_COMPARE, PROPERTY_TYPE_LABELS, cityName } from "@/lib/constants";
import { getStore } from "@/lib/data";
import { formatArea, formatPrice, formatRupees } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import type { Property } from "@/lib/types";
import { uuidSchema } from "@/lib/validation";
import { cn } from "@/lib/cn";

export const metadata: Metadata = pageMetadata({
  title: "Compare residences",
  description: "Compare up to three EstateX residences side by side.",
  path: "/compare",
  noIndex: true,
});

function parseIds(raw: string | string[] | undefined): string[] {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return [];
  return [...new Set(value.split(","))].filter((id) => uuidSchema.safeParse(id).success).slice(0, MAX_COMPARE);
}

interface Row {
  label: string;
  value: (p: Property) => React.ReactNode;
  /** Numeric score for "best" highlighting; higher wins unless `lowerIsBetter`. */
  score?: (p: Property) => number | null;
  lowerIsBetter?: boolean;
  bestLabel?: string;
}

const pricePerSqft = (p: Property) => (p.areaSqft ? Math.round(p.price / p.areaSqft) : null);

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: "Essentials",
    rows: [
      { label: "Price", value: (p) => <span className="font-medium">{formatPrice(p.price)}</span>, score: (p) => p.price, lowerIsBetter: true, bestLabel: "Lowest price" },
      {
        label: "Price per sq.ft.",
        value: (p) => (pricePerSqft(p) ? formatRupees(pricePerSqft(p)!) : "—"),
        score: pricePerSqft,
        lowerIsBetter: true,
        bestLabel: "Best value per sq.ft.",
      },
      { label: "Location", value: (p) => `${p.locality}, ${cityName(p.city)}` },
      { label: "Property type", value: (p) => PROPERTY_TYPE_LABELS[p.type] },
      { label: "Status", value: (p) => <StatusLabel status={p.status} /> },
    ],
  },
  {
    title: "Space",
    rows: [
      { label: "Area", value: (p) => formatArea(p.areaSqft), score: (p) => p.areaSqft, bestLabel: "Largest" },
      { label: "Bedrooms", value: (p) => p.bedrooms, score: (p) => p.bedrooms, bestLabel: "Most bedrooms" },
      { label: "Bathrooms", value: (p) => p.bathrooms, score: (p) => p.bathrooms, bestLabel: "Most bathrooms" },
      { label: "Parking", value: (p) => (p.parking === 1 ? "1 space" : `${p.parking} spaces`), score: (p) => p.parking, bestLabel: "Most parking" },
      { label: "Year built", value: (p) => p.yearBuilt ?? "—", score: (p) => p.yearBuilt, bestLabel: "Newest" },
    ],
  },
];

function bestIds(row: Row, properties: Property[]): Set<string> {
  if (!row.score || properties.length < 2) return new Set();
  const scored = properties.map((p) => ({ id: p.id, s: row.score!(p) })).filter((x): x is { id: string; s: number } => x.s != null);
  if (scored.length < 2) return new Set();
  const target = row.lowerIsBetter ? Math.min(...scored.map((x) => x.s)) : Math.max(...scored.map((x) => x.s));
  const winners = scored.filter((x) => x.s === target);
  // A tie across every residence is not worth highlighting.
  return winners.length === properties.length ? new Set() : new Set(winners.map((x) => x.id));
}

export default async function ComparePage(props: PageProps<"/compare">) {
  const params = await props.searchParams;
  const ids = parseIds(params.ids);
  const properties = ids.length ? await getStore().getPropertiesByIds(ids) : [];
  const cleared = params.cleared === "1";

  const shared = properties.length
    ? properties.map((p) => new Set(p.amenities)).reduce((acc, set) => new Set([...acc].filter((a) => set.has(a))))
    : new Set<string>();
  const cols = properties.length;

  return (
    <div className="pb-32 pt-14 md:pb-44 md:pt-20">
      <header className="container-site mb-16 grid gap-8 md:mb-20 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="hero-fade eyebrow text-muted">Side by side</p>
          <h1 className="hero-fade mt-6 text-h1" style={{ animationDelay: "80ms" }}>
            Compare
          </h1>
        </div>
        <p className="hero-fade max-w-sm text-[0.9375rem] leading-relaxed text-muted lg:col-span-4 lg:col-start-9 lg:pb-3" style={{ animationDelay: "160ms" }}>
          Up to {MAX_COMPARE} residences. A small mark highlights the strongest figure in each row.
        </p>
      </header>

      {ids.length === 0 ? (
        <div className="container-site">
          {cleared ? (
            <EmptyState
              eyebrow="Compare"
              title="Nothing to compare yet"
              body="Choose Compare on up to three residences and they'll appear here side by side."
              action={
                <ButtonLink href="/properties" arrow>
                  Explore properties
                </ButtonLink>
              }
            />
          ) : (
            <CompareFromDevice />
          )}
        </div>
      ) : properties.length === 0 ? (
        <div className="container-site">
          <EmptyState
            eyebrow="Compare"
            title="These residences are no longer listed"
            body="The homes in this comparison may have been withdrawn."
            action={
              <ButtonLink href="/properties" arrow>
                Explore properties
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <>
          <SyncCompare
            items={properties.map((p) => ({ id: p.id, slug: p.slug, name: p.name, coverUrl: p.cover?.url ?? null }))}
          />
          <div className="md:container-site">
            <div className="overflow-x-auto overscroll-x-contain pb-4" role="region" aria-label="Comparison table" tabIndex={0}>
              <table className="w-full min-w-[calc(9rem+var(--cols)*15.5rem)] border-collapse text-left" style={{ ["--cols" as string]: cols }}>
                <caption className="sr-only">Comparison of {properties.map((p) => p.name).join(", ")}</caption>
                <colgroup>
                  <col className="w-36 md:w-52" />
                  {properties.map((p) => (
                    <col key={p.id} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <td className="sticky left-0 z-10 bg-ivory align-bottom" />
                    {properties.map((p) => (
                      <th key={p.id} scope="col" className="px-3 pb-10 align-top font-normal md:px-5">
                        <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                          <Photo src={p.cover?.url} alt={p.cover?.alt ?? ""} blurDataUrl={p.cover?.blurDataUrl} fill sizes="(min-width: 1024px) 26vw, 62vw" className="object-cover" />
                          <div className="absolute right-3 top-3">
                            <RemoveFromCompare id={p.id} name={p.name} ids={properties.map((x) => x.id)} />
                          </div>
                        </div>
                        <p className="eyebrow mt-5 text-muted">{PROPERTY_TYPE_LABELS[p.type]}</p>
                        <Link href={`/properties/${p.slug}`} className="mt-2 block font-serif text-[1.75rem] leading-[1.05] hover:underline hover:decoration-1 hover:underline-offset-4">
                          {p.name}
                        </Link>
                      </th>
                    ))}
                    {cols < MAX_COMPARE ? (
                      <td className="hidden px-5 pb-10 align-top lg:table-cell">
                        <Link
                          href="/properties"
                          className="flex aspect-[4/3] flex-col items-center justify-center gap-3 border border-dashed border-ink/25 text-[0.875rem] text-muted transition-colors hover:border-ink hover:text-ink"
                        >
                          <Plus aria-hidden className="size-5" strokeWidth={1.25} />
                          Add a residence
                        </Link>
                      </td>
                    ) : null}
                  </tr>
                </thead>
                {GROUPS.map((group) => (
                  <tbody key={group.title}>
                    <tr>
                      <th scope="colgroup" colSpan={cols + 1} className="sticky left-0 bg-ivory pb-4 pt-12 text-left">
                        <span className="eyebrow text-muted">{group.title}</span>
                      </th>
                    </tr>
                    {group.rows.map((row) => {
                      const best = bestIds(row, properties);
                      return (
                        <tr key={row.label} className="border-t border-line">
                          <th scope="row" className="sticky left-0 z-10 bg-ivory py-5 pr-4 align-top text-[0.8125rem] font-normal text-muted">
                            {row.label}
                          </th>
                          {properties.map((p) => (
                            <td key={p.id} className="px-3 py-5 align-top text-[0.9375rem] tabular-nums md:px-5">
                              <span className="inline-flex items-center gap-2.5">
                                {row.value(p)}
                                {best.has(p.id) ? (
                                  <span className="inline-flex items-center" title={row.bestLabel}>
                                    <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                                    <span className="sr-only">({row.bestLabel})</span>
                                  </span>
                                ) : null}
                              </span>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                ))}
                <tbody>
                  <tr>
                    <th scope="colgroup" colSpan={cols + 1} className="sticky left-0 bg-ivory pb-4 pt-12 text-left">
                      <span className="eyebrow text-muted">Amenities</span>
                    </th>
                  </tr>
                  {cols > 1 ? (
                    <tr className="border-t border-line">
                      <th scope="row" className="sticky left-0 z-10 bg-ivory py-5 pr-4 align-top text-[0.8125rem] font-normal text-muted">
                        In common
                      </th>
                      <td colSpan={cols} className="px-3 py-5 text-[0.9375rem] md:px-5">
                        {shared.size ? [...shared].map((a) => AMENITY_BY_SLUG[a]?.label ?? a).join(" · ") : "None in common"}
                      </td>
                    </tr>
                  ) : null}
                  <tr className="border-t border-line">
                    <th scope="row" className="sticky left-0 z-10 bg-ivory py-5 pr-4 align-top text-[0.8125rem] font-normal text-muted">
                      {cols > 1 ? "Only here" : "Included"}
                    </th>
                    {properties.map((p) => {
                      const own = p.amenities.filter((a) => cols === 1 || !shared.has(a));
                      return (
                        <td key={p.id} className="px-3 py-5 align-top md:px-5">
                          {own.length ? (
                            <ul className="flex flex-col gap-3">
                              {own.map((a) => (
                                <li key={a} className="flex items-center gap-3 text-[0.9375rem]">
                                  <AmenityIcon icon={AMENITY_BY_SLUG[a]?.icon ?? ""} className="size-4 shrink-0 text-muted" />
                                  {AMENITY_BY_SLUG[a]?.label ?? a}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-line">
                    <td className="sticky left-0 z-10 bg-ivory" />
                    {properties.map((p) => (
                      <td key={p.id} className={cn("px-3 pt-10 md:px-5")}>
                        <ArrowLink href={`/properties/${p.slug}`}>View residence</ArrowLink>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div className="container-site">
            {cols < MAX_COMPARE ? (
              <p className="mt-16 text-[0.9375rem] text-muted lg:hidden">
                <Link href="/properties" className="text-ink underline underline-offset-4">
                  Add another residence
                </Link>{" "}
                to compare up to {MAX_COMPARE}.
              </p>
            ) : null}
            <p className="mt-24 max-w-2xl text-[0.75rem] leading-relaxed text-muted">{DEMO_NOTICE}</p>
          </div>
        </>
      )}
    </div>
  );
}
