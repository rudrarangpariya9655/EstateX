import {
  AMENITY_BY_SLUG,
  CITY_BY_SLUG,
  PRICE_PRESETS,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_PLURALS,
  SORT_OPTIONS,
} from "../constants";
import { formatPrice } from "../format";
import {
  CITY_SLUGS,
  PROPERTY_TYPES,
  type CitySlug,
  type PropertyFilters,
  type PropertySummary,
  type PropertyType,
  type SortOption,
} from "../types";

export type ViewMode = "grid" | "map";

export interface SearchState extends PropertyFilters {
  page: number;
  view: ViewMode;
}

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function read(source: ParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

function readInt(source: ParamSource, key: string, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = read(source, key);
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  const i = Math.floor(n);
  return i < min || i > max ? undefined : i;
}

function readList(source: ParamSource, key: string): string[] {
  const raw = read(source, key);
  if (!raw) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
}

const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((o) => o.value));

export const DEFAULT_SORT: SortOption = "featured";

/** Parse URL search params into a validated, normalised search state. Unknown values are dropped. */
export function parseSearchState(source: ParamSource): SearchState {
  const city = read(source, "city");
  const sort = read(source, "sort");
  const q = (read(source, "q") ?? "").trim().slice(0, 80);

  let minPrice = readInt(source, "minPrice", { min: 0, max: 10_000_000_000 });
  let maxPrice = readInt(source, "maxPrice", { min: 0, max: 10_000_000_000 });
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];

  let minArea = readInt(source, "minArea", { min: 0, max: 1_000_000 });
  let maxArea = readInt(source, "maxArea", { min: 0, max: 1_000_000 });
  if (minArea != null && maxArea != null && minArea > maxArea) [minArea, maxArea] = [maxArea, minArea];

  return {
    q: q || undefined,
    city: (CITY_SLUGS as readonly string[]).includes(city ?? "") ? (city as CitySlug) : undefined,
    types: readList(source, "type").filter((t): t is PropertyType =>
      (PROPERTY_TYPES as readonly string[]).includes(t),
    ),
    minPrice,
    maxPrice,
    beds: readInt(source, "beds", { min: 1, max: 10 }),
    baths: readInt(source, "baths", { min: 1, max: 10 }),
    minArea,
    maxArea,
    amenities: readList(source, "amenities").filter((a) => a in AMENITY_BY_SLUG),
    availableOnly: read(source, "available") === "1",
    sort: sort && SORT_VALUES.has(sort) ? (sort as SortOption) : DEFAULT_SORT,
    page: readInt(source, "page", { min: 1, max: 1000 }) ?? 1,
    view: read(source, "view") === "map" ? "map" : "grid",
  };
}

/** Serialise a search state back to URL params, omitting defaults so URLs stay short and shareable. */
export function serializeSearchState(state: Partial<SearchState>): URLSearchParams {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.city) params.set("city", state.city);
  if (state.types?.length) params.set("type", state.types.join(","));
  if (state.minPrice != null) params.set("minPrice", String(state.minPrice));
  if (state.maxPrice != null) params.set("maxPrice", String(state.maxPrice));
  if (state.beds != null) params.set("beds", String(state.beds));
  if (state.baths != null) params.set("baths", String(state.baths));
  if (state.minArea != null) params.set("minArea", String(state.minArea));
  if (state.maxArea != null) params.set("maxArea", String(state.maxArea));
  if (state.amenities?.length) params.set("amenities", state.amenities.join(","));
  if (state.availableOnly) params.set("available", "1");
  if (state.sort && state.sort !== DEFAULT_SORT) params.set("sort", state.sort);
  if (state.view === "map") params.set("view", "map");
  if (state.page && state.page > 1) params.set("page", String(state.page));
  return params;
}

export function searchHref(state: Partial<SearchState>): string {
  const qs = serializeSearchState(state).toString();
  return qs ? `/properties?${qs}` : "/properties";
}

const CITY_ALIASES: Record<string, string> = {
  bangalore: "bengaluru",
  bombay: "mumbai",
  "new delhi": "delhi",
  newdelhi: "delhi",
  poona: "pune",
};

export function tokenize(query: string): string[] {
  let normalized = query.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    normalized = normalized.replaceAll(alias, canonical);
  }
  return normalized
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1)
    .slice(0, 6);
}

type Filterable = PropertySummary & { amenities?: string[] };

function haystack(p: Filterable): string {
  const city = CITY_BY_SLUG[p.city];
  return [p.name, p.tagline, p.locality, city?.name, city?.state, PROPERTY_TYPE_LABELS[p.type], p.type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function matchesFilters(p: Filterable, f: PropertyFilters): boolean {
  if (f.city && p.city !== f.city) return false;
  if (f.types.length && !f.types.includes(p.type)) return false;
  if (f.minPrice != null && p.price < f.minPrice) return false;
  if (f.maxPrice != null && p.price > f.maxPrice) return false;
  if (f.beds != null && p.bedrooms < f.beds) return false;
  if (f.baths != null && p.bathrooms < f.baths) return false;
  if (f.minArea != null && p.areaSqft < f.minArea) return false;
  if (f.maxArea != null && p.areaSqft > f.maxArea) return false;
  if (f.availableOnly && p.status !== "available") return false;
  if (f.amenities.length) {
    const has = new Set(p.amenities ?? []);
    if (!f.amenities.every((a) => has.has(a))) return false;
  }
  if (f.q) {
    const text = haystack(p);
    if (!tokenize(f.q).every((token) => text.includes(token))) return false;
  }
  return true;
}

export function sortProperties<T extends PropertySummary>(items: T[], sort: SortOption): T[] {
  const byNewest = (a: T, b: T) => b.createdAt.localeCompare(a.createdAt);
  const sorted = [...items];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price || byNewest(a, b));
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price || byNewest(a, b));
    case "newest":
      return sorted.sort(byNewest);
    case "featured":
    default:
      // Featured first, then available before reserved/sold, then newest.
      return sorted.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          Number(a.status !== "available") - Number(b.status !== "available") ||
          byNewest(a, b),
      );
  }
}

/** Number of "advanced" filters applied in the drawer (used for the Filters button badge). */
export function countAdvancedFilters(f: PropertyFilters): number {
  return (
    (f.beds != null ? 1 : 0) +
    (f.baths != null ? 1 : 0) +
    (f.minArea != null || f.maxArea != null ? 1 : 0) +
    f.amenities.length +
    (f.availableOnly ? 1 : 0) +
    (f.types.length > 1 ? 1 : 0)
  );
}

export function hasActiveFilters(f: PropertyFilters): boolean {
  return Boolean(
    f.q ||
      f.city ||
      f.types.length ||
      f.minPrice != null ||
      f.maxPrice != null ||
      countAdvancedFilters(f) > 0,
  );
}

export function pricePresetValue(minPrice?: number, maxPrice?: number): string {
  if (minPrice == null && maxPrice == null) return "";
  const preset = PRICE_PRESETS.find((p) => p.min === minPrice && p.max === maxPrice);
  return preset?.value ?? "custom";
}

export function pricePresetRange(value: string): { minPrice?: number; maxPrice?: number } {
  const preset = PRICE_PRESETS.find((p) => p.value === value);
  return preset ? { minPrice: preset.min, maxPrice: preset.max } : {};
}

/** Human sentence describing the current search, e.g. "Villas in Goa between ₹3 Cr and ₹6 Cr". */
export function describeFilters(f: PropertyFilters): string {
  const subject =
    f.types.length === 1
      ? PROPERTY_TYPE_PLURALS[f.types[0]!]
      : f.types.length > 1
        ? f.types.map((t) => PROPERTY_TYPE_PLURALS[t]).join(" and ")
        : "residences";
  const parts: string[] = [subject.charAt(0).toUpperCase() + subject.slice(1)];
  if (f.city) parts.push(`in ${CITY_BY_SLUG[f.city].name}`);
  if (f.minPrice != null && f.maxPrice != null) {
    parts.push(`between ${formatPrice(f.minPrice)} and ${formatPrice(f.maxPrice)}`);
  } else if (f.maxPrice != null) {
    parts.push(`under ${formatPrice(f.maxPrice)}`);
  } else if (f.minPrice != null) {
    parts.push(`from ${formatPrice(f.minPrice)}`);
  }
  const extras: string[] = [];
  if (f.beds) extras.push(`${f.beds}+ bedrooms`);
  if (f.baths) extras.push(`${f.baths}+ bathrooms`);
  if (f.minArea != null && f.maxArea != null) extras.push(`${f.minArea.toLocaleString("en-IN")}–${f.maxArea.toLocaleString("en-IN")} sq.ft.`);
  else if (f.minArea != null) extras.push(`at least ${f.minArea.toLocaleString("en-IN")} sq.ft.`);
  else if (f.maxArea != null) extras.push(`up to ${f.maxArea.toLocaleString("en-IN")} sq.ft.`);
  if (f.amenities.length) {
    extras.push(f.amenities.map((a) => AMENITY_BY_SLUG[a]?.label.toLowerCase() ?? a).join(", "));
  }
  let sentence = parts.join(" ");
  if (extras.length) sentence += ` with ${extras.join(", ")}`;
  if (f.q) sentence += ` matching “${f.q}”`;
  if (f.availableOnly) sentence += " — available now";
  return sentence;
}
