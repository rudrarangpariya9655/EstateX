import "server-only";
import { randomUUID } from "node:crypto";
import type { PostgrestError } from "@supabase/supabase-js";
import { createSupabaseServerClient, getSupabasePublicClient } from "../supabase/server";
import { tokenize } from "../search/filters";
import {
  CITY_SLUGS,
  type Agent,
  type CitySlug,
  type Inquiry,
  type NearbyPlace,
  type Property,
  type PropertyFilters,
  type PropertySummary,
  type SortOption,
  type UserProfile,
  type VisitRequest,
} from "../types";
import { DataError, visitReference, type DataStore } from "./store";

// ── Row shapes ──────────────────────────────────────────────────────────────

interface ListingRow {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  city: CitySlug;
  locality: string;
  price: number;
  type: PropertySummary["type"];
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  parking: number;
  status: PropertySummary["status"];
  featured: boolean;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  cover_id: string | null;
  cover_url: string | null;
  cover_alt: string | null;
  cover_blur: string | null;
}

interface PropertyRow extends Omit<ListingRow, "cover_id" | "cover_url" | "cover_alt" | "cover_blur"> {
  description: string;
  address: string;
  year_built: number | null;
  nearby: NearbyPlace[];
  agent_id: string | null;
  agent: AgentRow | null;
  property_images: ImageRow[];
  property_amenities: { amenity_slug: string }[];
}

interface ImageRow {
  id: string;
  url: string;
  alt: string;
  kind: "photo" | "floor_plan";
  label: string | null;
  position: number;
  blur_data_url: string | null;
}

interface AgentRow {
  id: string;
  name: string;
  title: string;
  bio: string;
  languages: string[];
}

interface VisitRow {
  id: string;
  reference: string;
  property_id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string;
  preferred_date: string;
  preferred_time: string;
  message: string;
  status: VisitRequest["status"];
  created_at: string;
}

interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserProfile["role"];
  created_at: string;
}

const PROPERTY_SELECT =
  "*, agent:agents(id, name, title, bio, languages), property_images(id, url, alt, kind, label, position, blur_data_url), property_amenities(amenity_slug)";

// ── Mapping ─────────────────────────────────────────────────────────────────

function fail(error: PostgrestError | null, fallback = "The database request failed."): never {
  const code = error?.code;
  if (code === "23505") throw new DataError("A property with this slug already exists.", "conflict");
  if (code === "42501") throw new DataError("You do not have permission to do that.", "forbidden");
  if (code === "P0002" || code === "PGRST116") throw new DataError("Not found.", "not_found");
  if (code === "22023") throw new DataError(error?.message ?? fallback, "invalid");
  console.error("[supabase]", error);
  throw new DataError(fallback, "unavailable");
}

function listingToSummary(r: ListingRow): PropertySummary {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    city: r.city,
    locality: r.locality,
    price: Number(r.price),
    type: r.type,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    areaSqft: r.area_sqft,
    parking: r.parking,
    status: r.status,
    featured: r.featured,
    latitude: r.latitude,
    longitude: r.longitude,
    cover: r.cover_url
      ? { id: r.cover_id ?? r.id, url: r.cover_url, alt: r.cover_alt ?? r.name, position: 0, blurDataUrl: r.cover_blur }
      : null,
    createdAt: r.created_at,
  };
}

function rowToProperty(r: PropertyRow): Property {
  const images = r.property_images
    .filter((i) => i.kind === "photo")
    .sort((a, b) => a.position - b.position)
    .map((i) => ({ id: i.id, url: i.url, alt: i.alt, position: i.position, blurDataUrl: i.blur_data_url }));
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    city: r.city,
    locality: r.locality,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
    price: Number(r.price),
    type: r.type,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    areaSqft: r.area_sqft,
    yearBuilt: r.year_built,
    parking: r.parking,
    status: r.status,
    featured: r.featured,
    amenities: r.property_amenities.map((a) => a.amenity_slug).sort(),
    images,
    cover: images[0] ?? null,
    floorPlans: r.property_images
      .filter((i) => i.kind === "floor_plan")
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ id: i.id, url: i.url, label: i.label ?? "Floor plan", position: i.position })),
    nearby: Array.isArray(r.nearby) ? r.nearby : [],
    agentId: r.agent_id,
    agent: r.agent
      ? { id: r.agent.id, name: r.agent.name, title: r.agent.title, bio: r.agent.bio, languages: r.agent.languages }
      : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function visitFromRow(r: VisitRow, property: PropertySummary | undefined): VisitRequest {
  return {
    id: r.id,
    reference: r.reference,
    propertyId: r.property_id,
    userId: r.user_id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    preferredDate: r.preferred_date,
    preferredTime: r.preferred_time,
    message: r.message,
    status: r.status,
    createdAt: r.created_at,
    property: property
      ? {
          id: property.id,
          slug: property.slug,
          name: property.name,
          city: property.city,
          locality: property.locality,
          cover: property.cover,
        }
      : null,
  };
}

// ── Query helpers ───────────────────────────────────────────────────────────

interface FilterableQuery<Self> {
  eq(column: string, value: unknown): Self;
  in(column: string, values: readonly unknown[]): Self;
  gte(column: string, value: unknown): Self;
  lte(column: string, value: unknown): Self;
  contains(column: string, value: string[]): Self;
  ilike(column: string, pattern: string): Self;
  order(column: string, options?: { ascending?: boolean }): Self;
}

function applyFilters<Q extends FilterableQuery<Q>>(query: Q, f: PropertyFilters): Q {
  let q = query;
  if (f.city) q = q.eq("city", f.city);
  if (f.types.length) q = q.in("type", f.types);
  if (f.minPrice != null) q = q.gte("price", f.minPrice);
  if (f.maxPrice != null) q = q.lte("price", f.maxPrice);
  if (f.beds != null) q = q.gte("bedrooms", f.beds);
  if (f.baths != null) q = q.gte("bathrooms", f.baths);
  if (f.minArea != null) q = q.gte("area_sqft", f.minArea);
  if (f.maxArea != null) q = q.lte("area_sqft", f.maxArea);
  if (f.availableOnly) q = q.eq("status", "available");
  if (f.amenities.length) q = q.contains("amenity_slugs", f.amenities);
  // Tokens are restricted to [a-z0-9], so they are safe inside an ILIKE pattern.
  for (const token of tokenize(f.q ?? "")) q = q.ilike("search_text", `%${token}%`);
  return q;
}

function applySort<Q extends FilterableQuery<Q>>(query: Q, sort: SortOption): Q {
  switch (sort) {
    case "price-asc":
      return query.order("price", { ascending: true }).order("created_at", { ascending: false });
    case "price-desc":
      return query.order("price", { ascending: false }).order("created_at", { ascending: false });
    case "newest":
      return query.order("created_at", { ascending: false });
    default:
      return query
        .order("featured", { ascending: false })
        .order("is_available", { ascending: false })
        .order("created_at", { ascending: false });
  }
}

async function summariesByIds(ids: string[]): Promise<Map<string, PropertySummary>> {
  if (!ids.length) return new Map();
  const { data, error } = await getSupabasePublicClient()
    .from("property_listings")
    .select("*")
    .in("id", [...new Set(ids)]);
  if (error) fail(error);
  return new Map((data as ListingRow[]).map((r) => [r.id, listingToSummary(r)]));
}

// ── Store ───────────────────────────────────────────────────────────────────

export const supabaseStore: DataStore = {
  mode: "supabase",

  async searchProperties(filters, page, pageSize) {
    const from = (Math.max(1, page) - 1) * pageSize;
    const base = getSupabasePublicClient().from("property_listings").select("*", { count: "exact" });
    const { data, count, error } = await applySort(applyFilters(base, filters), filters.sort).range(
      from,
      from + pageSize - 1,
    );
    if (error) {
      // PostgREST answers PGRST103 (416) when the requested page is past the end.
      if (error.code === "PGRST103" && page > 1) return this.searchProperties(filters, 1, pageSize);
      fail(error);
    }
    const total = count ?? 0;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    return {
      items: (data as ListingRow[]).map(listingToSummary),
      total,
      page: Math.min(Math.max(1, page), pageCount),
      pageSize,
      pageCount,
    };
  },

  async searchAllProperties(filters) {
    const base = getSupabasePublicClient().from("property_listings").select("*");
    const { data, error } = await applySort(applyFilters(base, filters), filters.sort).limit(500);
    if (error) fail(error);
    return (data as ListingRow[]).map(listingToSummary);
  },

  async quickSearch(query, limit) {
    if (!tokenize(query).length) return [];
    const base = getSupabasePublicClient().from("property_listings").select("*");
    const filters: PropertyFilters = { q: query, types: [], amenities: [], availableOnly: false, sort: "featured" };
    const { data, error } = await applySort(applyFilters(base, filters), "featured").limit(limit);
    if (error) fail(error);
    return (data as ListingRow[]).map(listingToSummary);
  },

  async getFeaturedProperties(limit, excludeSlug) {
    let query = getSupabasePublicClient().from("property_listings").select("*").eq("featured", true);
    if (excludeSlug) query = query.neq("slug", excludeSlug);
    const { data, error } = await applySort(query, "featured").limit(limit);
    if (error) fail(error);
    return (data as ListingRow[]).map(listingToSummary);
  },

  async getPropertyBySlug(slug) {
    const { data, error } = await getSupabasePublicClient()
      .from("properties")
      .select(PROPERTY_SELECT)
      .eq("slug", slug)
      .maybeSingle();
    if (error) fail(error);
    return data ? rowToProperty(data as PropertyRow) : null;
  },

  async getPropertyById(id) {
    const { data, error } = await getSupabasePublicClient()
      .from("properties")
      .select(PROPERTY_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) fail(error);
    return data ? rowToProperty(data as PropertyRow) : null;
  },

  async getPropertiesByIds(ids) {
    if (!ids.length) return [];
    const { data, error } = await getSupabasePublicClient()
      .from("properties")
      .select(PROPERTY_SELECT)
      .in("id", [...new Set(ids)]);
    if (error) fail(error);
    const byId = new Map((data as PropertyRow[]).map((r) => [r.id, rowToProperty(r)]));
    return ids.map((id) => byId.get(id)).filter((p): p is Property => Boolean(p));
  },

  async getSimilarProperties(property, limit) {
    const { data, error } = await getSupabasePublicClient()
      .from("property_listings")
      .select("*")
      .neq("id", property.id)
      .or(`city.eq.${property.city},type.eq.${property.type}`)
      .limit(24);
    if (error) fail(error);
    const scored = (data as ListingRow[]).map(listingToSummary).map((p) => {
      let score = 0;
      if (p.city === property.city) score += 3;
      if (p.type === property.type) score += 2;
      const ratio = p.price / property.price;
      if (ratio > 0.5 && ratio < 2) score += 2;
      if (p.status === "available") score += 1;
      return { p, score };
    });
    scored.sort((a, b) => b.score - a.score || b.p.createdAt.localeCompare(a.p.createdAt));
    return scored.slice(0, limit).map(({ p }) => p);
  },

  async getPropertiesByCity(city, limit) {
    let query = applySort(getSupabasePublicClient().from("property_listings").select("*").eq("city", city), "featured");
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) fail(error);
    return (data as ListingRow[]).map(listingToSummary);
  },

  async getPropertiesByType(type) {
    const { data, error } = await applySort(
      getSupabasePublicClient().from("property_listings").select("*").eq("type", type),
      "featured",
    );
    if (error) fail(error);
    return (data as ListingRow[]).map(listingToSummary);
  },

  async getCityStats() {
    const { data, error } = await getSupabasePublicClient().from("properties").select("city, price");
    if (error) fail(error);
    const rows = data as { city: CitySlug; price: number }[];
    return CITY_SLUGS.map((city) => {
      const prices = rows.filter((r) => r.city === city).map((r) => Number(r.price));
      return {
        city,
        count: prices.length,
        minPrice: prices.length ? Math.min(...prices) : null,
        maxPrice: prices.length ? Math.max(...prices) : null,
      };
    });
  },

  async listPropertySlugs() {
    const { data, error } = await getSupabasePublicClient().from("properties").select("slug, updated_at");
    if (error) fail(error);
    return (data as { slug: string; updated_at: string }[]).map((r) => ({ slug: r.slug, updatedAt: r.updated_at }));
  },

  async listAgents() {
    const { data, error } = await getSupabasePublicClient().from("agents").select("*").order("name");
    if (error) fail(error);
    return (data as AgentRow[]).map(
      (a): Agent => ({ id: a.id, name: a.name, title: a.title, bio: a.bio, languages: a.languages }),
    );
  },

  async listAllProperties(opts) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("property_listings").select("*").order("updated_at", { ascending: false });
    if (opts?.status) query = query.eq("status", opts.status);
    for (const token of tokenize(opts?.q ?? "")) query = query.ilike("search_text", `%${token}%`);
    const { data, error } = await query;
    if (error) fail(error);
    return (data as ListingRow[]).map(listingToSummary);
  },

  async isSlugAvailable(slug, excludeId) {
    let query = getSupabasePublicClient().from("properties").select("id", { count: "exact", head: true }).eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { count, error } = await query;
    if (error) fail(error);
    return (count ?? 0) === 0;
  },

  async createProperty(input) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("save_property", { payload: input });
    if (error) fail(error, "Could not save the property.");
    const created = await this.getPropertyById(data as string);
    if (!created) throw new DataError("Property was saved but could not be loaded.", "unavailable");
    return created;
  },

  async updateProperty(id, input) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("save_property", { payload: input, target_id: id });
    if (error) fail(error, "Could not save the property.");
    const updated = await this.getPropertyById(id);
    if (!updated) throw new DataError("Property not found.", "not_found");
    return updated;
  },

  async deleteProperty(id) {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase.from("properties").delete({ count: "exact" }).eq("id", id);
    if (error) fail(error, "Could not delete the property.");
    if (!count) throw new DataError("Property not found.", "not_found");
  },

  async setPropertyStatus(id, status) {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase.from("properties").update({ status }, { count: "exact" }).eq("id", id);
    if (error) fail(error);
    if (!count) throw new DataError("Property not found.", "not_found");
  },

  async setPropertyFeatured(id, featured) {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase.from("properties").update({ featured }, { count: "exact" }).eq("id", id);
    if (error) fail(error);
    if (!count) throw new DataError("Property not found.", "not_found");
  },

  async getAdminStats() {
    const supabase = await createSupabaseServerClient();
    const head = { count: "exact" as const, head: true };
    const [all, available, reserved, sold, featured, pending, users, inquiries] = await Promise.all([
      supabase.from("properties").select("id", head),
      supabase.from("properties").select("id", head).eq("status", "available"),
      supabase.from("properties").select("id", head).eq("status", "reserved"),
      supabase.from("properties").select("id", head).eq("status", "sold"),
      supabase.from("properties").select("id", head).eq("featured", true),
      supabase.from("visit_requests").select("id", head).eq("status", "pending"),
      supabase.from("profiles").select("id", head),
      supabase.from("inquiries").select("id", head),
    ]);
    for (const r of [all, available, reserved, sold, featured, pending, users, inquiries]) if (r.error) fail(r.error);
    return {
      properties: all.count ?? 0,
      available: available.count ?? 0,
      reserved: reserved.count ?? 0,
      sold: sold.count ?? 0,
      featured: featured.count ?? 0,
      pendingVisits: pending.count ?? 0,
      users: users.count ?? 0,
      inquiries: inquiries.count ?? 0,
    };
  },

  async listFavoriteIds(userId) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("favorites")
      .select("property_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) fail(error);
    return (data as { property_id: string }[]).map((r) => r.property_id);
  },

  async setFavorite(userId, propertyId, saved) {
    const supabase = await createSupabaseServerClient();
    const { error } = saved
      ? await supabase
          .from("favorites")
          .upsert({ user_id: userId, property_id: propertyId }, { onConflict: "user_id,property_id", ignoreDuplicates: true })
      : await supabase.from("favorites").delete().eq("user_id", userId).eq("property_id", propertyId);
    if (error?.code === "23503") throw new DataError("Property not found.", "not_found");
    if (error) fail(error);
  },

  async addFavorites(userId, propertyIds) {
    if (!propertyIds.length) return;
    const existing = await summariesByIds(propertyIds);
    const rows = propertyIds.filter((id) => existing.has(id)).map((id) => ({ user_id: userId, property_id: id }));
    if (!rows.length) return;
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("favorites")
      .upsert(rows, { onConflict: "user_id,property_id", ignoreDuplicates: true });
    if (error) fail(error);
  },

  async createVisitRequest(input) {
    const supabase = await createSupabaseServerClient();
    const id = randomUUID();
    const row = {
      id,
      reference: visitReference(id),
      property_id: input.propertyId,
      user_id: input.userId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      preferred_date: input.preferredDate,
      preferred_time: input.preferredTime,
      message: input.message,
    };
    // No `.select()`: guests cannot read visit rows back under RLS.
    const { error } = await supabase.from("visit_requests").insert(row);
    if (error?.code === "23503") throw new DataError("Property not found.", "not_found");
    if (error) fail(error, "Could not submit the visit request.");
    const property = (await summariesByIds([input.propertyId])).get(input.propertyId);
    return visitFromRow({ ...row, status: "pending", message: input.message, created_at: new Date().toISOString() }, property);
  },

  async listVisitRequests(opts) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("visit_requests").select("*").order("created_at", { ascending: false });
    if (opts?.userId) query = query.eq("user_id", opts.userId);
    if (opts?.status) query = query.eq("status", opts.status);
    const { data, error } = await query;
    if (error) fail(error);
    const rows = data as VisitRow[];
    const properties = await summariesByIds(rows.map((r) => r.property_id));
    return rows.map((r) => visitFromRow(r, properties.get(r.property_id)));
  },

  async updateVisitStatus(id, status) {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase.from("visit_requests").update({ status }, { count: "exact" }).eq("id", id);
    if (error) fail(error);
    if (!count) throw new DataError("Visit request not found.", "not_found");
  },

  async cancelVisitRequest(userId, id) {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from("visit_requests")
      .update({ status: "cancelled" }, { count: "exact" })
      .eq("id", id)
      .eq("user_id", userId)
      .in("status", ["pending", "confirmed"]);
    if (error) fail(error);
    return (count ?? 0) > 0;
  },

  async recordView(userId, propertyId) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("recently_viewed")
      .upsert({ user_id: userId, property_id: propertyId, viewed_at: new Date().toISOString() }, { onConflict: "user_id,property_id" });
    if (error && error.code !== "23503") fail(error);
  },

  async listRecentlyViewed(userId, limit) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("recently_viewed")
      .select("property_id, viewed_at")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(limit);
    if (error) fail(error);
    const rows = data as { property_id: string; viewed_at: string }[];
    const properties = await summariesByIds(rows.map((r) => r.property_id));
    return rows.flatMap((r) => {
      const property = properties.get(r.property_id);
      return property ? [{ property, viewedAt: r.viewed_at }] : [];
    });
  },

  async createInquiry(input) {
    const supabase = await createSupabaseServerClient();
    const id = randomUUID();
    const { error } = await supabase.from("inquiries").insert({ id, ...input });
    if (error) fail(error, "Could not send your message.");
    return { id, ...input, createdAt: new Date().toISOString() } satisfies Inquiry;
  },

  async listInquiries() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false });
    if (error) fail(error);
    return (data as (Omit<Inquiry, "createdAt"> & { created_at: string })[]).map(({ created_at, ...r }) => ({
      ...r,
      createdAt: created_at,
    }));
  },

  async listUsers() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) fail(error);
    return (data as ProfileRow[]).map((r) => ({
      id: r.id,
      email: r.email,
      fullName: r.full_name,
      phone: r.phone,
      role: r.role,
      createdAt: r.created_at,
    }));
  },

  async setUserRole(userId, role) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("set_user_role", { target: userId, new_role: role });
    if (error) fail(error, "Could not update the role.");
  },

  async updateProfile(userId, data) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: data.fullName, phone: data.phone })
      .eq("id", userId);
    if (error) fail(error, "Could not update your profile.");
  },
};

