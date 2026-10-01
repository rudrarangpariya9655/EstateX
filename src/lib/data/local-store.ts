import "server-only";
import { randomUUID } from "node:crypto";
import { CITY_SLUGS, type Property, type PropertyInput, type VisitRequest } from "../types";
import { matchesFilters, sortProperties, tokenize } from "../search/filters";
import { mutateDb, readDb, type LocalDb } from "./local-db";
import { DataError, toSummary, visitReference, type DataStore } from "./store";

function hydrate(db: LocalDb, p: Property): Property {
  const agent = p.agentId ? (db.agents.find((a) => a.id === p.agentId) ?? null) : null;
  const images = [...p.images].sort((a, b) => a.position - b.position);
  return {
    ...p,
    images,
    cover: images[0] ?? null,
    floorPlans: [...p.floorPlans].sort((a, b) => a.position - b.position),
    agent,
  };
}

function propertySnippet(db: LocalDb, propertyId: string): VisitRequest["property"] {
  const p = db.properties.find((x) => x.id === propertyId);
  if (!p) return null;
  const s = toSummary(p);
  return { id: s.id, slug: s.slug, name: s.name, city: s.city, locality: s.locality, cover: s.cover };
}

function buildProperty(id: string, input: PropertyInput, createdAt: string, previous?: Property): Property {
  const images = input.images.map((img, position) => ({
    id: previous?.images.find((x) => x.url === img.url)?.id ?? randomUUID(),
    url: img.url,
    alt: img.alt,
    position,
    blurDataUrl: previous?.images.find((x) => x.url === img.url)?.blurDataUrl ?? null,
  }));
  return {
    id,
    slug: input.slug,
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    city: input.city,
    locality: input.locality,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    price: input.price,
    type: input.type,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    areaSqft: input.areaSqft,
    yearBuilt: input.yearBuilt,
    parking: input.parking,
    status: input.status,
    featured: input.featured,
    amenities: input.amenities,
    images,
    cover: images[0] ?? null,
    floorPlans: input.floorPlans.map((plan, position) => ({
      id: previous?.floorPlans.find((x) => x.url === plan.url)?.id ?? randomUUID(),
      url: plan.url,
      label: plan.label,
      position,
    })),
    nearby: previous?.nearby ?? [],
    agentId: input.agentId,
    agent: null,
    createdAt,
    updatedAt: new Date().toISOString(),
  };
}

export const localStore: DataStore = {
  mode: "local",

  async searchProperties(filters, page, pageSize) {
    const db = await readDb();
    const matches = sortProperties(
      db.properties.filter((p) => matchesFilters(p, filters)).map((p) => toSummary(hydrate(db, p))),
      filters.sort,
    );
    const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    const current = Math.min(Math.max(1, page), pageCount);
    return {
      items: matches.slice((current - 1) * pageSize, current * pageSize),
      total: matches.length,
      page: current,
      pageSize,
      pageCount,
    };
  },

  async searchAllProperties(filters) {
    const db = await readDb();
    return sortProperties(
      db.properties.filter((p) => matchesFilters(p, filters)).map((p) => toSummary(hydrate(db, p))),
      filters.sort,
    );
  },

  async quickSearch(query, limit) {
    if (tokenize(query).length === 0) return [];
    const db = await readDb();
    return sortProperties(
      db.properties
        .filter((p) => matchesFilters(p, { q: query, types: [], amenities: [], availableOnly: false, sort: "featured" }))
        .map((p) => toSummary(hydrate(db, p))),
      "featured",
    ).slice(0, limit);
  },

  async getFeaturedProperties(limit, excludeSlug) {
    const db = await readDb();
    return sortProperties(
      db.properties.filter((p) => p.featured && p.slug !== excludeSlug).map((p) => toSummary(hydrate(db, p))),
      "featured",
    ).slice(0, limit);
  },

  async getPropertyBySlug(slug) {
    const db = await readDb();
    const p = db.properties.find((x) => x.slug === slug);
    return p ? hydrate(db, p) : null;
  },

  async getPropertyById(id) {
    const db = await readDb();
    const p = db.properties.find((x) => x.id === id);
    return p ? hydrate(db, p) : null;
  },

  async getPropertiesByIds(ids) {
    const db = await readDb();
    return ids
      .map((id) => db.properties.find((p) => p.id === id))
      .filter((p): p is Property => Boolean(p))
      .map((p) => hydrate(db, p));
  },

  async getSimilarProperties(property, limit) {
    const db = await readDb();
    const scored = db.properties
      .filter((p) => p.id !== property.id)
      .map((p) => {
        let score = 0;
        if (p.city === property.city) score += 3;
        if (p.type === property.type) score += 2;
        const ratio = p.price / property.price;
        if (ratio > 0.5 && ratio < 2) score += 2;
        if (p.status === "available") score += 1;
        return { p, score };
      })
      .sort((a, b) => b.score - a.score || b.p.createdAt.localeCompare(a.p.createdAt));
    return scored.slice(0, limit).map(({ p }) => toSummary(hydrate(db, p)));
  },

  async getPropertiesByCity(city, limit) {
    const db = await readDb();
    const items = sortProperties(
      db.properties.filter((p) => p.city === city).map((p) => toSummary(hydrate(db, p))),
      "featured",
    );
    return limit ? items.slice(0, limit) : items;
  },

  async getPropertiesByType(type) {
    const db = await readDb();
    return sortProperties(
      db.properties.filter((p) => p.type === type).map((p) => toSummary(hydrate(db, p))),
      "featured",
    );
  },

  async getCityStats() {
    const db = await readDb();
    return CITY_SLUGS.map((city) => {
      const prices = db.properties.filter((p) => p.city === city).map((p) => p.price);
      return {
        city,
        count: prices.length,
        minPrice: prices.length ? Math.min(...prices) : null,
        maxPrice: prices.length ? Math.max(...prices) : null,
      };
    });
  },

  async listPropertySlugs() {
    const db = await readDb();
    return db.properties.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));
  },

  async listAgents() {
    const db = await readDb();
    return db.agents;
  },

  async listAllProperties(opts) {
    const db = await readDb();
    const tokens = opts?.q ? tokenize(opts.q) : [];
    return db.properties
      .filter((p) => !opts?.status || p.status === opts.status)
      .filter((p) => {
        if (!tokens.length) return true;
        const text = `${p.name} ${p.slug} ${p.locality} ${p.city}`.toLowerCase();
        return tokens.every((t) => text.includes(t));
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((p) => toSummary(hydrate(db, p)));
  },

  async isSlugAvailable(slug, excludeId) {
    const db = await readDb();
    return !db.properties.some((p) => p.slug === slug && p.id !== excludeId);
  },

  async createProperty(input) {
    return mutateDb((db) => {
      if (db.properties.some((p) => p.slug === input.slug)) {
        throw new DataError("A property with this slug already exists.", "conflict");
      }
      const now = new Date().toISOString();
      const property = buildProperty(randomUUID(), input, now);
      db.properties.push(property);
      return hydrate(db, property);
    });
  },

  async updateProperty(id, input) {
    return mutateDb((db) => {
      const index = db.properties.findIndex((p) => p.id === id);
      if (index === -1) throw new DataError("Property not found.", "not_found");
      if (db.properties.some((p) => p.slug === input.slug && p.id !== id)) {
        throw new DataError("A property with this slug already exists.", "conflict");
      }
      const previous = db.properties[index]!;
      const property = buildProperty(id, input, previous.createdAt, previous);
      db.properties[index] = property;
      return hydrate(db, property);
    });
  },

  async deleteProperty(id) {
    await mutateDb((db) => {
      const before = db.properties.length;
      db.properties = db.properties.filter((p) => p.id !== id);
      if (db.properties.length === before) throw new DataError("Property not found.", "not_found");
      // Mirror ON DELETE CASCADE in the SQL schema.
      db.favorites = db.favorites.filter((f) => f.propertyId !== id);
      db.recentlyViewed = db.recentlyViewed.filter((r) => r.propertyId !== id);
      db.visits = db.visits.filter((v) => v.propertyId !== id);
    });
  },

  async setPropertyStatus(id, status) {
    await mutateDb((db) => {
      const p = db.properties.find((x) => x.id === id);
      if (!p) throw new DataError("Property not found.", "not_found");
      p.status = status;
      p.updatedAt = new Date().toISOString();
    });
  },

  async setPropertyFeatured(id, featured) {
    await mutateDb((db) => {
      const p = db.properties.find((x) => x.id === id);
      if (!p) throw new DataError("Property not found.", "not_found");
      p.featured = featured;
      p.updatedAt = new Date().toISOString();
    });
  },

  async getAdminStats() {
    const db = await readDb();
    const count = (status: string) => db.properties.filter((p) => p.status === status).length;
    return {
      properties: db.properties.length,
      available: count("available"),
      reserved: count("reserved"),
      sold: count("sold"),
      featured: db.properties.filter((p) => p.featured).length,
      pendingVisits: db.visits.filter((v) => v.status === "pending").length,
      users: db.users.length,
      inquiries: db.inquiries.length,
    };
  },

  async listFavoriteIds(userId) {
    const db = await readDb();
    return db.favorites
      .filter((f) => f.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((f) => f.propertyId);
  },

  async setFavorite(userId, propertyId, saved) {
    await mutateDb((db) => {
      if (!db.properties.some((p) => p.id === propertyId)) throw new DataError("Property not found.", "not_found");
      const exists = db.favorites.some((f) => f.userId === userId && f.propertyId === propertyId);
      if (saved && !exists) db.favorites.push({ userId, propertyId, createdAt: new Date().toISOString() });
      if (!saved) db.favorites = db.favorites.filter((f) => !(f.userId === userId && f.propertyId === propertyId));
    });
  },

  async addFavorites(userId, propertyIds) {
    await mutateDb((db) => {
      const now = new Date().toISOString();
      for (const propertyId of propertyIds) {
        if (!db.properties.some((p) => p.id === propertyId)) continue;
        if (db.favorites.some((f) => f.userId === userId && f.propertyId === propertyId)) continue;
        db.favorites.push({ userId, propertyId, createdAt: now });
      }
    });
  },

  async createVisitRequest(input) {
    return mutateDb((db) => {
      const property = db.properties.find((p) => p.id === input.propertyId);
      if (!property) throw new DataError("Property not found.", "not_found");
      if (property.status === "sold") throw new DataError("This residence has been sold.", "invalid");
      const id = randomUUID();
      const visit = {
        id,
        reference: visitReference(id),
        ...input,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
      };
      db.visits.push(visit);
      return { ...visit, property: propertySnippet(db, visit.propertyId) };
    });
  },

  async listVisitRequests(opts) {
    const db = await readDb();
    return db.visits
      .filter((v) => (!opts?.userId || v.userId === opts.userId) && (!opts?.status || v.status === opts.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((v) => ({ ...v, property: propertySnippet(db, v.propertyId) }));
  },

  async updateVisitStatus(id, status) {
    await mutateDb((db) => {
      const visit = db.visits.find((v) => v.id === id);
      if (!visit) throw new DataError("Visit request not found.", "not_found");
      visit.status = status;
    });
  },

  async cancelVisitRequest(userId, id) {
    return mutateDb((db) => {
      const visit = db.visits.find((v) => v.id === id && v.userId === userId);
      if (!visit || !["pending", "confirmed"].includes(visit.status)) return false;
      visit.status = "cancelled";
      return true;
    });
  },

  async recordView(userId, propertyId) {
    await mutateDb((db) => {
      if (!db.properties.some((p) => p.id === propertyId)) return;
      db.recentlyViewed = db.recentlyViewed.filter((r) => !(r.userId === userId && r.propertyId === propertyId));
      db.recentlyViewed.push({ userId, propertyId, viewedAt: new Date().toISOString() });
      // Keep the most recent 30 per user.
      const mine = db.recentlyViewed
        .filter((r) => r.userId === userId)
        .sort((a, b) => b.viewedAt.localeCompare(a.viewedAt));
      const drop = new Set(mine.slice(30).map((r) => r.propertyId));
      db.recentlyViewed = db.recentlyViewed.filter((r) => r.userId !== userId || !drop.has(r.propertyId));
    });
  },

  async listRecentlyViewed(userId, limit) {
    const db = await readDb();
    return db.recentlyViewed
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.viewedAt.localeCompare(a.viewedAt))
      .slice(0, limit)
      .flatMap((r) => {
        const p = db.properties.find((x) => x.id === r.propertyId);
        return p ? [{ property: toSummary(hydrate(db, p)), viewedAt: r.viewedAt }] : [];
      });
  },

  async createInquiry(input) {
    return mutateDb((db) => {
      const inquiry = { id: randomUUID(), ...input, createdAt: new Date().toISOString() };
      db.inquiries.push(inquiry);
      return inquiry;
    });
  },

  async listInquiries() {
    const db = await readDb();
    return [...db.inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listUsers() {
    const db = await readDb();
    return db.users
      .map(({ passwordHash: _hash, ...user }) => user)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async setUserRole(userId, role) {
    await mutateDb((db) => {
      const user = db.users.find((u) => u.id === userId);
      if (!user) throw new DataError("User not found.", "not_found");
      user.role = role;
    });
  },

  async updateProfile(userId, data) {
    await mutateDb((db) => {
      const user = db.users.find((u) => u.id === userId);
      if (!user) throw new DataError("User not found.", "not_found");
      user.fullName = data.fullName;
      user.phone = data.phone;
    });
  },
};
