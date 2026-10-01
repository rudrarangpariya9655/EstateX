import type { CitySlug, NearbyCategory, PropertyStatus, PropertyType, SortOption, VisitStatus } from "./types";
import { unsplash } from "./images";

export const SITE = {
  name: "EstateX",
  tagline: "Exceptional homes. Thoughtfully discovered.",
  description:
    "EstateX is a curated platform for discovering distinctive homes across India — selected for architecture, location and the way they feel to live in.",
};

/** Shown wherever listing data appears so demo content is never mistaken for live inventory. */
export const DEMO_NOTICE =
  "EstateX is a portfolio demonstration. Residences, prices, agents and neighborhood details are illustrative seed data, not live listings or market information.";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Apartment",
  villa: "Villa",
  penthouse: "Penthouse",
  house: "Modern House",
  waterfront: "Waterfront Home",
};

export const PROPERTY_TYPE_PLURALS: Record<PropertyType, string> = {
  apartment: "apartments",
  villa: "villas",
  penthouse: "penthouses",
  house: "modern houses",
  waterfront: "waterfront homes",
};

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
};

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export interface CityInfo {
  slug: CitySlug;
  name: string;
  state: string;
  tagline: string;
  center: [number, number];
  image: { url: string; alt: string };
  intro: string;
  architecture: string;
  lifestyle: string;
  localities: { name: string; note: string }[];
}

export const CITIES: CityInfo[] = [
  {
    slug: "ahmedabad",
    name: "Ahmedabad",
    state: "Gujarat",
    tagline: "Brick, light and courtyards",
    center: [23.03, 72.53],
    image: {
      url: unsplash("1600573472592-401b489a3cdc"),
      alt: "A white perforated façade casting patterned shade over a timber-clad house",
    },
    intro:
      "A city that quietly shaped modern Indian architecture — and still builds homes around shade, courtyards and the slow movement of light.",
    architecture:
      "Ahmedabad is home to Louis Kahn's Indian Institute of Management, Le Corbusier's Mill Owners' Association building and B.V. Doshi's Sangath. That lineage shows in the city's best contemporary houses: exposed brick and concrete, jaali screens that filter the afternoon sun, and plans organized around a central court.",
    lifestyle:
      "Life moves between the old city's pols and the newer, greener western suburbs. Shela and Thaltej offer space and gardens; the Sabarmati riverfront brings evening walks and wide skies within reach of the center.",
    localities: [
      { name: "Shela", note: "Low-rise villas and gardens on the city's quiet western edge" },
      { name: "Thaltej", note: "Established, leafy and close to the SG Highway" },
      { name: "Ellisbridge", note: "Riverfront living a short walk from the old city" },
    ],
  },
  {
    slug: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    tagline: "A city that faces the sea",
    center: [19.05, 72.83],
    image: {
      url: unsplash("1567157577867-05ccb1388e66"),
      alt: "The promenade at Marine Drive curving along the Arabian Sea beneath residential towers",
    },
    intro:
      "Mumbai rewards those who know where to look — Art Deco crescents, quiet Bandra lanes and rooms that open to the Arabian Sea.",
    architecture:
      "From the Art Deco ensemble along Marine Drive to contemporary towers in Worli, Mumbai is a study in vertical living. The most sought-after homes balance height with privacy: sea-facing living rooms, deep balconies that temper the monsoon, and plans that turn away from the street.",
    lifestyle:
      "Life here is lived between the waterfront and the neighborhood café. Bandra's lanes, Juhu's beach and the restored mills of Lower Parel each keep a distinct rhythm — creative, coastal or cosmopolitan.",
    localities: [
      { name: "Bandra West", note: "Hillside lanes, old bungalows and the city's best cafés" },
      { name: "Juhu", note: "Low-rise homes along a long sweep of beach" },
      { name: "Lower Parel", note: "Former textile mills reimagined as lofts and galleries" },
    ],
  },
  {
    slug: "bengaluru",
    name: "Bengaluru",
    state: "Karnataka",
    tagline: "The garden city, reconsidered",
    center: [12.99, 77.62],
    image: {
      url: unsplash("1600047509807-ba8f99d2cdde"),
      alt: "A contemporary house with warm timber cladding set behind a green lawn",
    },
    intro:
      "A temperate climate and a canopy of old trees make Bengaluru one of the few Indian cities where indoor–outdoor living works all year.",
    architecture:
      "The city's residential character was set by its bungalows — deep verandahs, high ceilings and generous gardens. New homes borrow that openness: rooms that dissolve into courtyards, shaded terraces, and planting treated as part of the architecture rather than an afterthought.",
    lifestyle:
      "Indiranagar and Koramangala offer walkable streets and a lively food scene; the lakes of Hebbal bring water and birdlife; and the granite outcrops around Nandi Hills sit an hour north for weekends away.",
    localities: [
      { name: "Indiranagar", note: "Tree-lined avenues, independent shops and restaurants" },
      { name: "Whitefield", note: "Gated villa communities with room to spread out" },
      { name: "Hebbal", note: "Lakefront residences on the airport side of the city" },
    ],
  },
  {
    slug: "goa",
    name: "Goa",
    state: "Goa",
    tagline: "Laterite, monsoon and slow afternoons",
    center: [15.57, 73.77],
    image: {
      url: unsplash("1571003123894-1f0594d2b5d9"),
      alt: "Draped cabanas beside a still pool at dusk, framed by palm trees",
    },
    intro:
      "North Goa's villages pair Portuguese-era houses with a new generation of tropical modern homes, all built for the rhythm of the monsoon.",
    architecture:
      "Traditional Goan houses are built from red laterite, with oyster-shell windows, tiled roofs and the balcão — a shaded porch for greeting neighbors. Contemporary homes reinterpret these ideas with deep overhangs, cross-ventilation and pools set into the landscape.",
    lifestyle:
      "Assagao and Siolim trade beach crowds for paddy fields, river views and some of the state's best restaurants. The coast is minutes away, but life here is centerd on gardens, long lunches and the change of seasons.",
    localities: [
      { name: "Assagao", note: "Village lanes, heritage homes and a celebrated dining scene" },
      { name: "Siolim", note: "Riverside properties along the Chapora" },
      { name: "Candolim", note: "Close to the beach and the Fort Aguada headland" },
    ],
  },
  {
    slug: "pune",
    name: "Pune",
    state: "Maharashtra",
    tagline: "Hills within reach",
    center: [18.65, 73.68],
    image: {
      url: unsplash("1600585153490-76fb20a32601"),
      alt: "A dark-clad modern house with tall lit windows at dusk",
    },
    intro:
      "Pune combines leafy, established neighborhoods with the Sahyadri hills — where the monsoon turns every view green.",
    architecture:
      "Koregaon Park's bungalows and low apartment buildings sit beneath mature rain trees, while the ghats around Lonavala have become home to modern hillside retreats: stone, timber and glass arranged to frame the valley.",
    lifestyle:
      "The city offers a calmer pace than Mumbai with excellent schools, cafés and green streets. In the hills, life follows the weather — mist in the monsoon, clear skies through winter.",
    localities: [
      { name: "Koregaon Park", note: "Leafy lanes and the city's most established addresses" },
      { name: "Lonavala", note: "Hillside retreats above the valley, ninety minutes from Mumbai" },
    ],
  },
  {
    slug: "delhi",
    name: "Delhi",
    state: "Delhi",
    tagline: "Gardens, avenues and old trees",
    center: [28.56, 77.2],
    image: {
      url: unsplash("1597040663342-45b6af3d91a5"),
      alt: "Humayun's Tomb in red sandstone and marble, seen across a lawn lined with palms",
    },
    intro:
      "A capital of layered histories, where Mughal gardens, Lutyens' avenues and modern farmhouses each define a different idea of home.",
    architecture:
      "Central Delhi's low-density bungalow zone and colonies such as Golf Links and Sundar Nagar remain the city's most coveted. To the south, the farmhouses of Chhatarpur offer something rarer still — acres of private garden within the city limits.",
    lifestyle:
      "Mornings in Lodhi Garden, afternoons in the galleries of the city's south, evenings among its restaurants. Delhi rewards those who live at the scale of the neighborhood.",
    localities: [
      { name: "Golf Links", note: "Quiet, central and among the city's most established colonies" },
      { name: "Chhatarpur", note: "Farmhouse estates set within private landscaped grounds" },
    ],
  },
];

export const CITY_BY_SLUG = Object.fromEntries(CITIES.map((c) => [c.slug, c])) as Record<CitySlug, CityInfo>;

export function cityName(slug: string): string {
  return CITY_BY_SLUG[slug as CitySlug]?.name ?? slug;
}

export interface AmenityInfo {
  slug: string;
  label: string;
  icon: string;
}

/** Catalogue of amenities. Mirrored by the `amenities` table in Supabase. */
export const AMENITIES: AmenityInfo[] = [
  { slug: "pool", label: "Swimming pool", icon: "waves" },
  { slug: "garden", label: "Landscaped garden", icon: "trees" },
  { slug: "parking", label: "Private parking", icon: "car" },
  { slug: "gym", label: "Fitness studio", icon: "dumbbell" },
  { slug: "security", label: "24/7 security", icon: "shield" },
  { slug: "smart-home", label: "Smart home", icon: "cpu" },
  { slug: "balcony", label: "Balcony", icon: "fence" },
  { slug: "clubhouse", label: "Clubhouse", icon: "landmark" },
  { slug: "terrace", label: "Private terrace", icon: "sun" },
  { slug: "courtyard", label: "Courtyard", icon: "sprout" },
  { slug: "home-office", label: "Home office", icon: "laptop" },
  { slug: "home-theatre", label: "Home theatre", icon: "film" },
  { slug: "wine-cellar", label: "Wine cellar", icon: "wine" },
  { slug: "spa", label: "Spa & steam room", icon: "bath" },
  { slug: "fireplace", label: "Fireplace", icon: "flame" },
  { slug: "library", label: "Library", icon: "book" },
  { slug: "concierge", label: "Concierge", icon: "bell" },
  { slug: "private-lift", label: "Private lift", icon: "lift" },
  { slug: "sea-view", label: "Water views", icon: "sailboat" },
  { slug: "jetty", label: "Private jetty", icon: "anchor" },
  { slug: "ev-charging", label: "EV charging", icon: "plug" },
  { slug: "power-backup", label: "Power backup", icon: "battery" },
  { slug: "staff-quarters", label: "Staff quarters", icon: "users" },
];

export const AMENITY_BY_SLUG = Object.fromEntries(AMENITIES.map((a) => [a.slug, a])) as Record<
  string,
  AmenityInfo
>;

/** A small set of amenities offered as quick filters; the rest live in the drawer. */
export const FILTERABLE_AMENITIES = [
  "pool",
  "garden",
  "terrace",
  "sea-view",
  "smart-home",
  "home-office",
  "gym",
  "private-lift",
  "courtyard",
  "fireplace",
];

export interface CollectionInfo {
  slug: string;
  name: string;
  type: PropertyType;
  kicker: string;
  description: string;
  image: { url: string; alt: string };
}

export const COLLECTIONS: CollectionInfo[] = [
  {
    slug: "modern-villas",
    name: "Modern Villas",
    type: "villa",
    kicker: "Space, light and land",
    description:
      "Contemporary villas set within their own gardens — designed for privacy, entertaining and long, unhurried weekends.",
    image: {
      url: unsplash("1613490493576-7fde63acd811"),
      alt: "A two-storey white villa with a timber soffit overlooking a long reflecting pool",
    },
  },
  {
    slug: "urban-penthouses",
    name: "Urban Penthouses",
    type: "penthouse",
    kicker: "Above the city",
    description:
      "Top-floor residences with private terraces, generous volumes and views that change with the weather.",
    image: {
      url: unsplash("1564078516393-cf04bd966897"),
      alt: "A double-height penthouse living room with floor-to-ceiling windows at dusk",
    },
  },
  {
    slug: "waterfront-homes",
    name: "Waterfront Homes",
    type: "waterfront",
    kicker: "Water as a neighbor",
    description:
      "Homes on the sea, river and lake — where the view is the architecture's first consideration.",
    image: {
      url: unsplash("1597211833712-5e41faa202ea"),
      alt: "A low white house with a terrace looking out to the sea",
    },
  },
  {
    slug: "country-retreats",
    name: "Country Retreats",
    type: "house",
    kicker: "Away, but not far",
    description:
      "Modern houses in hills, forests and farmland — each within an easy drive of the city.",
    image: {
      url: unsplash("1600566753376-12c8ab7fb75b"),
      alt: "A timber and concrete house lit from within against a deep blue evening sky",
    },
  },
  {
    slug: "city-apartments",
    name: "City Apartments",
    type: "apartment",
    kicker: "Close to everything",
    description:
      "Considered apartments in the neighborhoods people actually want to live in.",
    image: {
      url: unsplash("1600210492486-724fe5c67fb0"),
      alt: "A warm living room with a leather sofa, plants and a gallery wall of photographs",
    },
  },
];

export const COLLECTION_BY_SLUG = Object.fromEntries(COLLECTIONS.map((c) => [c.slug, c])) as Record<
  string,
  CollectionInfo
>;

/** The property featured in the homepage "Signature Residence" section. */
export const SIGNATURE_PROPERTY_SLUG = "casa-verde";

export const PRICE_STEPS = [
  5_000_000, 10_000_000, 20_000_000, 30_000_000, 50_000_000, 75_000_000, 100_000_000, 150_000_000,
  200_000_000, 300_000_000, 500_000_000,
];

export const PRICE_PRESETS: { value: string; label: string; min?: number; max?: number }[] = [
  { value: "under-3", label: "Under ₹3 Cr", max: 30_000_000 },
  { value: "3-6", label: "₹3 – 6 Cr", min: 30_000_000, max: 60_000_000 },
  { value: "6-10", label: "₹6 – 10 Cr", min: 60_000_000, max: 100_000_000 },
  { value: "10-25", label: "₹10 – 25 Cr", min: 100_000_000, max: 250_000_000 },
  { value: "25-plus", label: "₹25 Cr and above", min: 250_000_000 },
];

export const AREA_STEPS = [1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000];

export const VISIT_TIME_SLOTS = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30"];

export const NEARBY_LABELS: Record<NearbyCategory, string> = {
  schools: "Schools",
  healthcare: "Hospitals",
  dining: "Restaurants",
  shopping: "Shopping",
  transit: "Transit",
};

export const PAGE_SIZE = 9;
export const MAX_COMPARE = 3;

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  declined: "Not available",
  completed: "Completed",
  cancelled: "Cancelled",
};
