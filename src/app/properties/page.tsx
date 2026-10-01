import type { Metadata } from "next";
import Link from "next/link";
import { PropertyCard } from "@/components/property/property-card";
import { MapView } from "@/components/search/map-view";
import { Pagination } from "@/components/search/pagination";
import { ResultsFrame } from "@/components/search/results-frame";
import { SearchProvider } from "@/components/search/search-context";
import { KeywordSearch, SearchToolbar } from "@/components/search/search-toolbar";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DEMO_NOTICE, PAGE_SIZE } from "@/lib/constants";
import { getStore } from "@/lib/data";
import { describeFilters, hasActiveFilters, parseSearchState, searchHref } from "@/lib/search/filters";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(props: PageProps<"/properties">): Promise<Metadata> {
  const state = parseSearchState(await props.searchParams);
  const filtered = hasActiveFilters(state);
  return pageMetadata({
    title: filtered ? describeFilters(state) : "Properties",
    description:
      "Browse every residence on EstateX — villas, penthouses, apartments, modern houses and waterfront homes across six Indian cities.",
    path: "/properties",
  });
}

export default async function PropertiesPage(props: PageProps<"/properties">) {
  const state = parseSearchState(await props.searchParams);
  const store = getStore();
  const filtered = hasActiveFilters(state);

  const result =
    state.view === "map"
      ? await store.searchAllProperties(state).then((items) => ({ items, total: items.length, page: 1, pageCount: 1 }))
      : await store.searchProperties(state, state.page, PAGE_SIZE);

  return (
    <SearchProvider state={state}>
      <header className="container-site pb-14 pt-14 md:pb-20 md:pt-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="hero-fade eyebrow text-muted">The catalogue</p>
            <h1 className="hero-fade mt-6 text-h1" style={{ animationDelay: "80ms" }}>
              Properties
            </h1>
            <p className="hero-fade mt-6 max-w-lg text-lead text-muted" style={{ animationDelay: "160ms" }}>
              Every residence we represent, in one place. Refine by city, type and price — or open the filters for
              everything else.
            </p>
          </div>
          <div className="hero-fade lg:col-span-5" style={{ animationDelay: "240ms" }}>
            <KeywordSearch />
          </div>
        </div>
      </header>

      <SearchToolbar />

      <section id="results" aria-labelledby="results-heading" className="container-site scroll-mt-40 pb-32 pt-10 md:pb-40 md:pt-12">
        <div className="mb-12 flex flex-col gap-2 md:mb-16 md:flex-row md:items-baseline md:justify-between md:gap-8">
          <h2 id="results-heading" className="text-[0.9375rem]" aria-live="polite">
            <span className="font-medium">
              {result.total} {result.total === 1 ? "property" : "properties"} found
            </span>
            {filtered ? <span className="text-muted"> — {describeFilters(state)}</span> : null}
          </h2>
          {filtered ? (
            <Link
              href={searchHref({ view: state.view, sort: state.sort })}
              className="shrink-0 text-[0.875rem] text-muted underline underline-offset-4 hover:text-ink"
            >
              Clear all filters
            </Link>
          ) : null}
        </div>

        <ResultsFrame>
          {result.items.length === 0 ? (
            <EmptyState
              eyebrow="No matches"
              title="No properties found"
              body="Try changing your filters — widening the price range or removing an amenity usually helps."
              action={
                <ButtonLink href={searchHref({ view: state.view })} variant="primary">
                  Reset filters
                </ButtonLink>
              }
            />
          ) : state.view === "map" ? (
            <MapView properties={result.items} />
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-x-8 gap-y-20 md:grid-cols-2 md:gap-y-24 xl:grid-cols-3 xl:gap-x-10">
                {result.items.map((property, i) => (
                  <li key={property.id}>
                    <PropertyCard property={property} preload={i < 3 && result.page === 1} headingLevel="h3" />
                  </li>
                ))}
              </ul>
              <Pagination state={state} page={result.page} pageCount={result.pageCount} />
            </>
          )}
        </ResultsFrame>

        <p className="mt-24 max-w-2xl text-[0.75rem] leading-relaxed text-muted">{DEMO_NOTICE}</p>
      </section>
    </SearchProvider>
  );
}
