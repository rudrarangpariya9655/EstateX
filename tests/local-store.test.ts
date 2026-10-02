/**
 * Exercises the demo-mode store end to end against a temporary data directory:
 * catalogue queries, admin CRUD, favorites, visit requests and their rules.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resetDbCache } from "@/lib/data/local-db";
import { localStore as store } from "@/lib/data/local-store";
import { hashPassword, signSession, verifyPassword, verifySession } from "@/lib/auth/crypto";
import type { PropertyInput } from "@/lib/types";
import { parseSearchState } from "@/lib/search/filters";

let dir: string;
const USER = "5b0d7a8e-1c2d-4e3f-8a9b-0c1d2e3f4a5b";

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "estatex-test-"));
  process.env.ESTATEX_DATA_DIR = dir;
  process.env.ESTATEX_AUTH_SECRET = "x".repeat(48);
  resetDbCache();
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
  resetDbCache();
});

const input = (overrides: Partial<PropertyInput> = {}): PropertyInput => ({
  name: "Store Test Villa",
  slug: "store-test-villa",
  tagline: "",
  description: "A test villa used to verify create, update and delete in the local store.",
  price: 45_000_000,
  city: "goa",
  locality: "Assagao",
  address: "",
  latitude: 15.6,
  longitude: 73.78,
  type: "villa",
  bedrooms: 4,
  bathrooms: 5,
  areaSqft: 5200,
  yearBuilt: 2024,
  parking: 3,
  amenities: ["pool", "garden"],
  status: "available",
  featured: false,
  agentId: null,
  images: [{ url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811", alt: "Villa and pool" }],
  floorPlans: [],
  ...overrides,
});

describe("catalogue", () => {
  it("serves 12–18 seeded demo residences across six cities", async () => {
    const all = await store.searchAllProperties(parseSearchState({}));
    expect(all.length).toBeGreaterThanOrEqual(12);
    expect(all.length).toBeLessThanOrEqual(18);
    const stats = await store.getCityStats();
    expect(stats.filter((s) => s.count > 0)).toHaveLength(6);
  });

  it("paginates search results", async () => {
    const page1 = await store.searchProperties(parseSearchState({}), 1, 5);
    const page2 = await store.searchProperties(parseSearchState({}), 2, 5);
    expect(page1.items).toHaveLength(5);
    expect(page1.pageCount).toBe(Math.ceil(page1.total / 5));
    expect(page1.items.map((p) => p.id)).not.toEqual(page2.items.map((p) => p.id));
  });
});

describe("admin CRUD", () => {
  let id = "";
  it("creates, rejects duplicate slugs, updates and deletes", async () => {
    const created = await store.createProperty(input());
    id = created.id;
    expect((await store.getPropertyBySlug("store-test-villa"))?.name).toBe("Store Test Villa");
    await expect(store.createProperty(input())).rejects.toThrow(/slug/);
    expect(await store.isSlugAvailable("store-test-villa")).toBe(false);
    expect(await store.isSlugAvailable("store-test-villa", id)).toBe(true);

    const updated = await store.updateProperty(id, input({ name: "Renamed Villa", price: 50_000_000 }));
    expect(updated.name).toBe("Renamed Villa");
    expect(updated.images[0]!.id).toBe(created.images[0]!.id);

    await store.setPropertyStatus(id, "reserved");
    await store.setPropertyFeatured(id, true);
    const after = await store.getPropertyById(id);
    expect(after?.status).toBe("reserved");
    expect(after?.featured).toBe(true);

    await store.setFavorite(USER, id, true);
    await store.deleteProperty(id);
    expect(await store.getPropertyById(id)).toBeNull();
    expect(await store.listFavoriteIds(USER)).not.toContain(id);
  });
});

describe("favorites and visits", () => {
  it("saves, merges and removes favorites without duplicates", async () => {
    const [a, b] = await store.searchAllProperties(parseSearchState({}));
    await store.setFavorite(USER, a!.id, true);
    await store.addFavorites(USER, [a!.id, b!.id]);
    expect((await store.listFavoriteIds(USER)).filter((x) => x === a!.id)).toHaveLength(1);
    await store.setFavorite(USER, a!.id, false);
    expect(await store.listFavoriteIds(USER)).toEqual([b!.id]);
  });

  it("stores visits as pending and lets only the owner cancel", async () => {
    const [p] = await store.searchAllProperties(parseSearchState({}));
    const visit = await store.createVisitRequest({
      propertyId: p!.id,
      userId: USER,
      name: "Asha Rao",
      email: "asha@example.com",
      phone: "+91 98200 12345",
      preferredDate: "2030-01-10",
      preferredTime: "11:30",
      message: "",
    });
    expect(visit.status).toBe("pending");
    expect(visit.reference).toMatch(/^EX-[2-9A-HJ-NP-Z]{6}$/);
    expect(await store.cancelVisitRequest("00000000-0000-4000-8000-000000000000", visit.id)).toBe(false);
    expect(await store.cancelVisitRequest(USER, visit.id)).toBe(true);
    expect(await store.cancelVisitRequest(USER, visit.id)).toBe(false);
  });
});

describe("demo-mode auth primitives", () => {
  it("hashes passwords and verifies them", async () => {
    const hash = await hashPassword("courtyard-2026");
    expect(hash).not.toContain("courtyard-2026");
    expect(await verifyPassword("courtyard-2026", hash)).toBe(true);
    expect(await verifyPassword("courtyard-2027", hash)).toBe(false);
  });

  it("rejects tampered or expired session tokens", async () => {
    const token = await signSession({ sub: USER, pwv: "v1", exp: Math.floor(Date.now() / 1000) + 60 });
    expect((await verifySession(token))?.sub).toBe(USER);
    const [body, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "attacker", pwv: "v1", exp: 9e9 })).toString("base64url");
    expect(await verifySession(`${forged}.${sig}`)).toBeNull();
    expect(await verifySession(`${body}.${sig}x`)).toBeNull();
    const expired = await signSession({ sub: USER, pwv: "v1", exp: 1 });
    expect(await verifySession(expired)).toBeNull();
  });
});
