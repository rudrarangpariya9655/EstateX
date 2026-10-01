import { describe, expect, it } from "vitest";
import {
  describeFilters,
  hasActiveFilters,
  matchesFilters,
  parseSearchState,
  searchHref,
  serializeSearchState,
  sortProperties,
  tokenize,
} from "@/lib/search/filters";
import { buildSeedProperties } from "@/lib/data/seed";
import { toSummary } from "@/lib/data/store";

const all = buildSeedProperties().map((p) => ({ ...toSummary({ ...p, agent: null }), amenities: p.amenities }));

describe("parseSearchState", () => {
  it("drops unknown and invalid values", () => {
    const s = parseSearchState(new URLSearchParams("city=paris&type=villa,castle&beds=99&sort=random&page=-3&amenities=pool,moat&view=map"));
    expect(s.city).toBeUndefined();
    expect(s.types).toEqual(["villa"]);
    expect(s.beds).toBeUndefined();
    expect(s.sort).toBe("featured");
    expect(s.page).toBe(1);
    expect(s.amenities).toEqual(["pool"]);
    expect(s.view).toBe("map");
  });

  it("swaps inverted price and area ranges", () => {
    const s = parseSearchState({ minPrice: "90000000", maxPrice: "30000000", minArea: "5000", maxArea: "1000" });
    expect([s.minPrice, s.maxPrice]).toEqual([30000000, 90000000]);
    expect([s.minArea, s.maxArea]).toEqual([1000, 5000]);
  });

  it("round-trips through the URL and omits defaults", () => {
    const s = parseSearchState(new URLSearchParams("q=sea&city=goa&type=villa,waterfront&minPrice=30000000&beds=3&available=1&sort=price-asc&page=2"));
    const again = parseSearchState(serializeSearchState(s));
    expect(again).toEqual(s);
    expect(searchHref({ sort: "featured", page: 1, view: "grid" })).toBe("/properties");
  });
});

describe("matching and sorting", () => {
  it("filters by city, type and price", () => {
    const f = parseSearchState({ city: "goa", maxPrice: "100000000" });
    const results = all.filter((p) => matchesFilters(p, f));
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.city === "goa" && p.price <= 100000000)).toBe(true);
  });

  it("requires every selected amenity", () => {
    const f = parseSearchState({ amenities: "pool,sea-view" });
    const results = all.filter((p) => matchesFilters(p, f));
    expect(results.every((p) => p.amenities.includes("pool") && p.amenities.includes("sea-view"))).toBe(true);
  });

  it("matches keyword search including city aliases", () => {
    expect(tokenize("Bangalore villa")).toEqual(["bengaluru", "villa"]);
    const f = parseSearchState({ q: "bombay" });
    const results = all.filter((p) => matchesFilters(p, f));
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.city === "mumbai")).toBe(true);
  });

  it("sorts by price in both directions", () => {
    const asc = sortProperties(all, "price-asc").map((p) => p.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = sortProperties(all, "price-desc").map((p) => p.price);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  it("puts featured, available homes first by default", () => {
    const sorted = sortProperties(all, "featured");
    const firstNonFeatured = sorted.findIndex((p) => !p.featured);
    expect(sorted.slice(firstNonFeatured).some((p) => p.featured)).toBe(false);
  });
});

describe("describeFilters", () => {
  it("writes a readable sentence", () => {
    const f = parseSearchState({ type: "villa", city: "goa", minPrice: "30000000", maxPrice: "60000000", beds: "3" });
    expect(describeFilters(f)).toBe("Villas in Goa between ₹3 Cr and ₹6 Cr with 3+ bedrooms");
    expect(hasActiveFilters(f)).toBe(true);
    expect(hasActiveFilters(parseSearchState({}))).toBe(false);
  });
});
