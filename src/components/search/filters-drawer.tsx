"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox, Select } from "@/components/ui/field";
import {
  AMENITIES,
  AMENITY_BY_SLUG,
  AREA_STEPS,
  CITIES,
  FILTERABLE_AMENITIES,
  PRICE_STEPS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/constants";
import { formatNumber, formatPrice } from "@/lib/format";
import { serializeSearchState, type SearchState } from "@/lib/search/filters";
import { PROPERTY_TYPES, type CitySlug, type PropertyType } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useSearch } from "./search-context";

type Draft = Pick<
  SearchState,
  "city" | "types" | "minPrice" | "maxPrice" | "beds" | "baths" | "minArea" | "maxArea" | "amenities" | "availableOnly"
>;

const EMPTY: Draft = {
  city: undefined,
  types: [],
  minPrice: undefined,
  maxPrice: undefined,
  beds: undefined,
  baths: undefined,
  minArea: undefined,
  maxArea: undefined,
  amenities: [],
  availableOnly: false,
};

function draftFrom(state: SearchState): Draft {
  return {
    city: state.city,
    types: state.types,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    beds: state.beds,
    baths: state.baths,
    minArea: state.minArea,
    maxArea: state.maxArea,
    amenities: state.amenities,
    availableOnly: state.availableOnly,
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line py-7 first:border-t-0 first:pt-0">
      <legend className="float-left mb-5 w-full eyebrow text-muted">{title}</legend>
      <div className="clear-left">{children}</div>
    </fieldset>
  );
}

function Segmented({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  options: { value: number | undefined; label: string }[];
}) {
  return (
    <div className="flex flex-wrap">
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <label
            key={opt.label}
            className={cn(
              "-ml-px first:ml-0 inline-flex h-11 min-w-14 cursor-pointer items-center justify-center border px-4 text-[0.875rem] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
              checked ? "relative z-10 border-ink bg-ink text-ivory" : "border-line bg-surface hover:bg-ink/[0.04]",
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={checked}
              onChange={() => onChange(opt.value)}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

const COUNT_OPTIONS = [
  { value: undefined, label: "Any" },
  { value: 1, label: "1+" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
  { value: 5, label: "5+" },
];

/** Advanced filters live here, out of the way, so the catalogue stays calm. */
export function FiltersDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, update } = useSearch();
  const id = useId();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(state));
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  // Start from the live search each time the drawer opens (state adjusted during render, not in an effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(draftFrom(state));
  }

  // Live result count for the draft.
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const params = serializeSearchState({ ...draft, q: state.q, sort: state.sort });
        const res = await fetch(`/api/properties/count?${params}`, { signal: controller.signal });
        if (res.ok) setCount(((await res.json()) as { count: number }).count);
      } catch {
        // Count is a nicety; the button falls back to "Show results".
      }
    }, 200);
    return () => {
      controller.abort();
      window.clearTimeout(t);
    };
  }, [draft, open, state.q, state.sort]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const toggleIn = <K extends "types" | "amenities">(key: K, value: string) =>
    setDraft((d) => {
      const list = d[key] as string[];
      return { ...d, [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value] };
    });

  const amenityList = showAllAmenities
    ? AMENITIES.map((a) => a.slug)
    : [...new Set([...FILTERABLE_AMENITIES, ...draft.amenities])];

  const apply = () => {
    update({ ...draft });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Filters"
      description="Refine the catalogue. Results update when you apply."
      variant="drawer"
      footer={
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setDraft(EMPTY)}
            className="min-h-11 text-[0.875rem] text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Reset all
          </button>
          <Button type="button" onClick={apply} disabled={count === 0}>
            {count == null ? "Show results" : count === 0 ? "No matches" : `Show ${count} ${count === 1 ? "residence" : "residences"}`}
          </Button>
        </div>
      }
    >
      <Section title="Location">
        <Select
          aria-label="Location"
          value={draft.city ?? ""}
          onChange={(e) => set("city", (e.target.value || undefined) as CitySlug | undefined)}
        >
          <option value="">All locations</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      </Section>

      <Section title="Property type">
        <div className="grid grid-cols-2 gap-x-4">
          {PROPERTY_TYPES.map((t) => (
            <Checkbox
              key={t}
              label={PROPERTY_TYPE_LABELS[t]}
              checked={draft.types.includes(t)}
              onChange={() => toggleIn("types", t as PropertyType)}
            />
          ))}
        </div>
      </Section>

      <Section title="Price">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${id}-min-price`} className="mb-2 block text-[0.8125rem] text-muted">
              Minimum
            </label>
            <Select
              id={`${id}-min-price`}
              value={draft.minPrice ?? ""}
              onChange={(e) => set("minPrice", e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">No minimum</option>
              {PRICE_STEPS.map((p) => (
                <option key={p} value={p} disabled={draft.maxPrice != null && p > draft.maxPrice}>
                  {formatPrice(p)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor={`${id}-max-price`} className="mb-2 block text-[0.8125rem] text-muted">
              Maximum
            </label>
            <Select
              id={`${id}-max-price`}
              value={draft.maxPrice ?? ""}
              onChange={(e) => set("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">No maximum</option>
              {PRICE_STEPS.map((p) => (
                <option key={p} value={p} disabled={draft.minPrice != null && p < draft.minPrice}>
                  {formatPrice(p)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Bedrooms">
        <Segmented name={`${id}-beds`} value={draft.beds} onChange={(v) => set("beds", v)} options={COUNT_OPTIONS} />
      </Section>

      <Section title="Bathrooms">
        <Segmented
          name={`${id}-baths`}
          value={draft.baths}
          onChange={(v) => set("baths", v)}
          options={COUNT_OPTIONS.slice(0, 5)}
        />
      </Section>

      <Section title="Area (sq.ft.)">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${id}-min-area`} className="mb-2 block text-[0.8125rem] text-muted">
              Minimum
            </label>
            <Select
              id={`${id}-min-area`}
              value={draft.minArea ?? ""}
              onChange={(e) => set("minArea", e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">No minimum</option>
              {AREA_STEPS.map((a) => (
                <option key={a} value={a} disabled={draft.maxArea != null && a > draft.maxArea}>
                  {formatNumber(a)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor={`${id}-max-area`} className="mb-2 block text-[0.8125rem] text-muted">
              Maximum
            </label>
            <Select
              id={`${id}-max-area`}
              value={draft.maxArea ?? ""}
              onChange={(e) => set("maxArea", e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">No maximum</option>
              {AREA_STEPS.map((a) => (
                <option key={a} value={a} disabled={draft.minArea != null && a < draft.minArea}>
                  {formatNumber(a)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Amenities">
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          {amenityList.map((slug) => (
            <Checkbox
              key={slug}
              label={AMENITY_BY_SLUG[slug]?.label ?? slug}
              checked={draft.amenities.includes(slug)}
              onChange={() => toggleIn("amenities", slug)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowAllAmenities((v) => !v)}
          aria-expanded={showAllAmenities}
          className="mt-3 min-h-11 text-[0.875rem] underline underline-offset-4"
        >
          {showAllAmenities ? "Show fewer amenities" : `Show all ${AMENITIES.length} amenities`}
        </button>
      </Section>

      <Section title="Availability">
        <Checkbox
          label="Only show residences available now"
          checked={draft.availableOnly}
          onChange={(e) => set("availableOnly", e.target.checked)}
        />
      </Section>
    </Dialog>
  );
}
