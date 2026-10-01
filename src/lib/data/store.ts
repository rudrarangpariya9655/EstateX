import type {
  Agent,
  CityStat,
  Inquiry,
  InquiryInput,
  PageResult,
  Property,
  PropertyFilters,
  PropertyInput,
  PropertyStatus,
  PropertySummary,
  PropertyType,
  RecentlyViewed,
  UserProfile,
  UserRole,
  VisitRequest,
  VisitRequestInput,
  VisitStatus,
} from "../types";

export interface AdminStats {
  properties: number;
  available: number;
  reserved: number;
  sold: number;
  featured: number;
  pendingVisits: number;
  users: number;
  inquiries: number;
}

/**
 * The persistence contract used by every page, action and route handler.
 * Implemented by the Supabase store (production) and the local JSON store
 * (demo mode / development without credentials).
 *
 * Authorisation is enforced by callers (`requireUser` / `requireAdmin`) and,
 * in Supabase mode, again by row-level security in the database.
 */
export interface DataStore {
  readonly mode: "local" | "supabase";

  // ── Public catalogue ────────────────────────────────────────────────────
  searchProperties(filters: PropertyFilters, page: number, pageSize: number): Promise<PageResult<PropertySummary>>;
  /** Every match for the map view (no pagination, summaries only). */
  searchAllProperties(filters: PropertyFilters): Promise<PropertySummary[]>;
  quickSearch(query: string, limit: number): Promise<PropertySummary[]>;
  getFeaturedProperties(limit: number, excludeSlug?: string): Promise<PropertySummary[]>;
  getPropertyBySlug(slug: string): Promise<Property | null>;
  getPropertyById(id: string): Promise<Property | null>;
  /** Full records for the given ids, in the requested order (comparison, saved). */
  getPropertiesByIds(ids: string[]): Promise<Property[]>;
  getSimilarProperties(property: Property, limit: number): Promise<PropertySummary[]>;
  getPropertiesByCity(city: string, limit?: number): Promise<PropertySummary[]>;
  getPropertiesByType(type: PropertyType): Promise<PropertySummary[]>;
  getCityStats(): Promise<CityStat[]>;
  listPropertySlugs(): Promise<{ slug: string; updatedAt: string }[]>;
  listAgents(): Promise<Agent[]>;

  // ── Administration ──────────────────────────────────────────────────────
  listAllProperties(opts?: { q?: string; status?: PropertyStatus }): Promise<PropertySummary[]>;
  isSlugAvailable(slug: string, excludeId?: string): Promise<boolean>;
  createProperty(input: PropertyInput): Promise<Property>;
  updateProperty(id: string, input: PropertyInput): Promise<Property>;
  deleteProperty(id: string): Promise<void>;
  setPropertyStatus(id: string, status: PropertyStatus): Promise<void>;
  setPropertyFeatured(id: string, featured: boolean): Promise<void>;
  getAdminStats(): Promise<AdminStats>;

  // ── Favorites ──────────────────────────────────────────────────────────
  listFavoriteIds(userId: string): Promise<string[]>;
  setFavorite(userId: string, propertyId: string, saved: boolean): Promise<void>;
  addFavorites(userId: string, propertyIds: string[]): Promise<void>;

  // ── Visit requests ──────────────────────────────────────────────────────
  createVisitRequest(input: VisitRequestInput): Promise<VisitRequest>;
  listVisitRequests(opts?: { userId?: string; status?: VisitStatus }): Promise<VisitRequest[]>;
  updateVisitStatus(id: string, status: VisitStatus): Promise<void>;
  /** Cancels a pending/confirmed request owned by the user. Returns false if not permitted. */
  cancelVisitRequest(userId: string, id: string): Promise<boolean>;

  // ── Recently viewed ─────────────────────────────────────────────────────
  recordView(userId: string, propertyId: string): Promise<void>;
  listRecentlyViewed(userId: string, limit: number): Promise<RecentlyViewed[]>;

  // ── Inquiries (contact + list-your-property) ────────────────────────────
  createInquiry(input: InquiryInput): Promise<Inquiry>;
  listInquiries(): Promise<Inquiry[]>;

  // ── Users ───────────────────────────────────────────────────────────────
  listUsers(): Promise<UserProfile[]>;
  setUserRole(userId: string, role: UserRole): Promise<void>;
  updateProfile(userId: string, data: { fullName: string; phone: string | null }): Promise<void>;
}

export function toSummary(p: Property): PropertySummary {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    city: p.city,
    locality: p.locality,
    price: p.price,
    type: p.type,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    areaSqft: p.areaSqft,
    parking: p.parking,
    status: p.status,
    featured: p.featured,
    latitude: p.latitude,
    longitude: p.longitude,
    cover: p.images[0] ?? null,
    createdAt: p.createdAt,
  };
}

/** Short, human-friendly visit reference such as "EX-7K3QF2". */
export function visitReference(id: string): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const hex = id.replace(/-/g, "");
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[parseInt(hex.slice(i * 2, i * 2 + 2), 16) % alphabet.length];
  return `EX-${out}`;
}

export class DataError extends Error {
  constructor(
    message: string,
    readonly code: "not_found" | "conflict" | "forbidden" | "invalid" | "unavailable" = "invalid",
  ) {
    super(message);
    this.name = "DataError";
  }
}
