"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LayoutGrid, Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react";
import { CITIES, PRICE_PRESETS, PROPERTY_TYPE_LABELS, SORT_OPTIONS } from "@/lib/constants";
import { countAdvancedFilters, pricePresetRange, pricePresetValue, type ViewMode } from "@/lib/search/filters";
import { PROPERTY_TYPES, type CitySlug, type PropertyType, type SortOption } from "@/lib/types";
import { cn } from "@/lib/cn";
import { FiltersDrawer } from "./filters-drawer";
import { useSearch } from "./search-context";

const compactSelect =
  "ex-select h-11 appearance-none border border-line bg-surface pl-4 pr-10 text-[0.875rem] text-ink outline-none transition-colors hover:border-ink/40 focus:border-accent focus:ring-1 focus:ring-accent";

export function KeywordSearch() {
  const { state, update } = useSearch();
  const id = useId();
  const [value, setValue] = useState(state.q ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the field in sync when the URL changes elsewhere (reset, back button) —
  // but never while the visitor is typing, so in-flight keystrokes are not overwritten.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setValue(state.q ?? "");
  }, [state.q]);

  // Debounced live search; replaces history so typing doesn't flood the back stack.
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === (state.q ?? "")) return;
    if (trimmed.length === 1) return;
    const t = window.setTimeout(() => update({ q: trimmed || undefined }, { replace: true }), 450);
    return () => window.clearTimeout(t);
  }, [value, state.q, update]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        update({ q: value.trim() || undefined });
      }}
      className="relative w-full"
    >
      <label htmlFor={id} className="sr-only">
        Search properties by name, neighborhood or city
      </label>
      <Search aria-hidden className="pointer-events-none absolute left-0 top-1/2 size-5 -translate-y-1/2 text-muted" strokeWidth={1.25} />
      <input
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by name, neighborhood or city"
        autoComplete="off"
        enterKeyHint="search"
        className="h-14 w-full border-b border-ink/25 bg-transparent pl-9 pr-10 text-[1.0625rem] outline-none transition-colors placeholder:text-muted/70 focus:border-ink [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue("");
            update({ q: undefined });
          }}
          className="absolute right-0 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center text-muted hover:text-ink"
          aria-label="Clear search"
        >
          <X aria-hidden className="size-4" strokeWidth={1.5} />
        </button>
      ) : null}
    </form>
  );
}

export function SearchToolbar() {
  const { state, update } = useSearch();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const advancedCount = countAdvancedFilters(state);
  const id = useId();

  const typeValue = state.types.length === 1 ? state.types[0] : state.types.length > 1 ? "multiple" : "";
  const priceValue = pricePresetValue(state.minPrice, state.maxPrice);

  return (
    <div className="sticky top-16 z-20 border-y border-line bg-ivory/95 backdrop-blur-md">
      <div className="container-site flex h-[4.25rem] items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-3 lg:flex">
          <label htmlFor={`${id}-city`} className="sr-only">
            Location
          </label>
          <select
            id={`${id}-city`}
            value={state.city ?? ""}
            onChange={(e) => update({ city: (e.target.value || undefined) as CitySlug | undefined })}
            className={cn(compactSelect, "w-36 xl:w-44")}
          >
            <option value="">All locations</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <label htmlFor={`${id}-type`} className="sr-only">
            Property type
          </label>
          <select
            id={`${id}-type`}
            value={typeValue}
            onChange={(e) => update({ types: e.target.value ? [e.target.value as PropertyType] : [] })}
            className={cn(compactSelect, "w-40 xl:w-48")}
          >
            <option value="">All types</option>
            {state.types.length > 1 ? (
              <option value="multiple" disabled>
                {state.types.length} types selected
              </option>
            ) : null}
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {PROPERTY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>

          <label htmlFor={`${id}-price`} className="sr-only">
            Price range
          </label>
          <select
            id={`${id}-price`}
            value={priceValue}
            onChange={(e) => update({ minPrice: undefined, maxPrice: undefined, ...pricePresetRange(e.target.value) })}
            className={cn(compactSelect, "w-40 xl:w-48")}
          >
            <option value="">Any price</option>
            {priceValue === "custom" ? (
              <option value="custom" disabled>
                Custom range
              </option>
            ) : null}
            {PRICE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          className="inline-flex h-11 items-center gap-2.5 border border-line bg-surface px-4 text-[0.875rem] transition-colors hover:border-ink/40"
        >
          <SlidersHorizontal aria-hidden className="size-4" strokeWidth={1.4} />
          <span>Filters</span>
          {advancedCount ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[0.6875rem] leading-5 text-ivory">
              {advancedCount}
              <span className="sr-only"> active</span>
            </span>
          ) : null}
        </button>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <label htmlFor={`${id}-sort`} className="sr-only">
            Sort by
          </label>
          <select
            id={`${id}-sort`}
            value={state.sort}
            onChange={(e) => update({ sort: e.target.value as SortOption })}
            className={cn(compactSelect, "w-[8.75rem] sm:w-44 xl:w-48")}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <div role="group" aria-label="View" className="flex h-11 border border-line bg-surface">
            {(
              [
                ["grid", "Grid", LayoutGrid],
                ["map", "Map", MapIcon],
              ] as const
            ).map(([mode, label, Icon]) => (
              <button
                key={mode}
                type="button"
                aria-pressed={state.view === mode}
                onClick={() => update({ view: mode as ViewMode, page: state.page })}
                className={cn(
                  "inline-flex min-w-11 items-center justify-center gap-2 px-3 text-[0.8125rem] transition-colors xl:px-4",
                  state.view === mode ? "bg-ink text-ivory" : "text-ink hover:bg-ink/5",
                )}
              >
                <Icon aria-hidden className="size-4" strokeWidth={1.4} />
                <span className="hidden xl:inline">{label}</span>
                <span className="sr-only xl:hidden">{label} view</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <FiltersDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
