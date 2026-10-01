"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { CITIES, PRICE_PRESETS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { pricePresetRange, searchHref } from "@/lib/search/filters";
import { PROPERTY_TYPES, type CitySlug, type PropertyType } from "@/lib/types";

/**
 * Deliberately small: three questions and a search button. Everything else
 * lives on the Properties page. On phones it opens as a sheet to keep the hero calm.
 */
export function HeroSearch() {
  const router = useRouter();
  const id = useId();
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSheetOpen(false);
    router.push(
      searchHref({
        city: (city || undefined) as CitySlug | undefined,
        types: type ? [type as PropertyType] : [],
        ...pricePresetRange(price),
      }),
    );
  };

  const fields = (layout: "bar" | "sheet") => {
    const selectClass =
      layout === "bar"
        ? "h-auto border-0 bg-transparent p-0 pr-8 text-[1rem] focus:ring-0 [background-position:right_0_center]"
        : undefined;
    const wrap = (key: string, label: string, control: ReactNode) =>
      layout === "bar" ? (
        <label
          key={key}
          className="flex min-w-0 flex-1 cursor-pointer flex-col justify-center gap-1 border-r border-line px-7 py-4 transition-colors focus-within:bg-ivory hover:bg-ivory/60"
        >
          <span className="eyebrow text-muted">{label}</span>
          {control}
        </label>
      ) : (
        <Field key={key} id={`${id}-${key}-sheet`} label={label}>
          {control}
        </Field>
      );
    return [
      wrap(
        "city",
        "Location",
        <Select id={`${id}-city-${layout}`} value={city} onChange={(e) => setCity(e.target.value)} className={selectClass}>
          <option value="">All cities</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>,
      ),
      wrap(
        "type",
        "Property type",
        <Select id={`${id}-type-${layout}`} value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {PROPERTY_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>,
      ),
      wrap(
        "price",
        "Price range",
        <Select id={`${id}-price-${layout}`} value={price} onChange={(e) => setPrice(e.target.value)} className={selectClass}>
          <option value="">Any price</option>
          {PRICE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>,
      ),
    ];
  };

  return (
    <>
      {/* Tablet and desktop: a single quiet bar. */}
      <form
        onSubmit={submit}
        role="search"
        aria-label="Find a property"
        className="hidden w-full max-w-[56rem] items-stretch bg-surface text-ink shadow-[0_30px_60px_-40px_rgb(0_0_0/0.6)] md:flex"
      >
        {fields("bar")}
        <button
          type="submit"
          className="arrow-nudge inline-flex shrink-0 items-center gap-3 bg-ink px-8 label-caps text-ivory transition-colors duration-300 hover:bg-accent"
        >
          Search <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
        </button>
      </form>

      {/* Phones: one calm entry point that opens a sheet. */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex h-14 w-full items-center gap-3 bg-surface px-5 text-left text-[0.9375rem] text-ink md:hidden"
        aria-haspopup="dialog"
      >
        <Search aria-hidden className="size-4 text-muted" strokeWidth={1.5} />
        <span className="flex-1 text-muted">Location, type or price</span>
        <span className="label-caps text-[0.68rem]">Search</span>
      </button>
      <Dialog open={sheetOpen} onClose={() => setSheetOpen(false)} title="Find a property" variant="modal">
        <form onSubmit={submit} className="flex flex-col gap-6">
          {fields("sheet")}
          <Button type="submit" arrow className="mt-2 w-full">
            Search
          </Button>
        </form>
      </Dialog>
    </>
  );
}
