export const PROPERTY_TYPES = ["apartment", "villa", "penthouse", "house", "waterfront"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_STATUSES = ["available", "reserved", "sold"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const VISIT_STATUSES = ["pending", "confirmed", "declined", "completed", "cancelled"] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CITY_SLUGS = ["ahmedabad", "mumbai", "bengaluru", "goa", "pune", "delhi"] as const;
export type CitySlug = (typeof CITY_SLUGS)[number];

export const NEARBY_CATEGORIES = ["schools", "healthcare", "dining", "shopping", "transit"] as const;
export type NearbyCategory = (typeof NEARBY_CATEGORIES)[number];

export interface PropertyImage {
  id: string;
  url: string;
  alt: string;
  position: number;
  blurDataUrl?: string | null;
}

export interface FloorPlan {
  id: string;
  url: string;
  label: string;
  position: number;
}

export interface NearbyPlace {
  category: NearbyCategory;
  name: string;
  distanceKm: number;
}

export interface Agent {
  id: string;
  name: string;
  title: string;
  bio: string;
  languages: string[];
}

/** Lightweight shape used by cards, maps, lists and comparisons. */
export interface PropertySummary {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  city: CitySlug;
  locality: string;
  price: number;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  parking: number;
  status: PropertyStatus;
  featured: boolean;
  latitude: number;
  longitude: number;
  cover: PropertyImage | null;
  createdAt: string;
}

export interface Property extends PropertySummary {
  description: string;
  address: string;
  yearBuilt: number | null;
  amenities: string[];
  images: PropertyImage[];
  floorPlans: FloorPlan[];
  nearby: NearbyPlace[];
  agentId: string | null;
  agent: Agent | null;
  updatedAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
}

export interface UserProfile extends SessionUser {
  createdAt: string;
}

export interface VisitRequest {
  id: string;
  reference: string;
  propertyId: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
  status: VisitStatus;
  createdAt: string;
  property?: Pick<PropertySummary, "id" | "slug" | "name" | "city" | "locality" | "cover"> | null;
}

export const INQUIRY_TOPICS = ["general", "listing"] as const;
export type InquiryTopic = (typeof INQUIRY_TOPICS)[number];

export interface Inquiry {
  id: string;
  topic: InquiryTopic;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  details: Record<string, string> | null;
  createdAt: string;
}

export interface RecentlyViewed {
  property: PropertySummary;
  viewedAt: string;
}

export type SortOption = "featured" | "newest" | "price-asc" | "price-desc";

export interface PropertyFilters {
  q?: string;
  city?: CitySlug;
  types: PropertyType[];
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  minArea?: number;
  maxArea?: number;
  amenities: string[];
  availableOnly: boolean;
  sort: SortOption;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface CityStat {
  city: CitySlug;
  count: number;
  minPrice: number | null;
  maxPrice: number | null;
}

/** Input accepted by create/update operations (already validated). */
export interface PropertyInput {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price: number;
  city: CitySlug;
  locality: string;
  address: string;
  latitude: number;
  longitude: number;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  yearBuilt: number | null;
  parking: number;
  amenities: string[];
  status: PropertyStatus;
  featured: boolean;
  agentId: string | null;
  images: { url: string; alt: string }[];
  floorPlans: { url: string; label: string }[];
}

export interface VisitRequestInput {
  propertyId: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
}

export interface InquiryInput {
  topic: InquiryTopic;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  details: Record<string, string> | null;
}
