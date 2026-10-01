/**
 * DEMO SEED DATA
 * ─────────────────────────────────────────────────────────────────────────────
 * Every residence, price, agent and neighborhood distance in this file is
 * illustrative portfolio content. It is not a live listing and does not
 * describe real properties or market prices. Replace or delete freely; the
 * Supabase seed (`supabase/seed.sql`) is generated from this file with
 * `npm run db:seed-sql`.
 */
import { createHash } from "node:crypto";
import { unsplash } from "../images";
import type { Agent, CitySlug, NearbyPlace, Property, PropertyStatus, PropertyType } from "../types";
import blurPlaceholders from "./blur-placeholders.json";

const BLUR: Record<string, string> = blurPlaceholders;

/** Deterministic UUID (v5-style) so the local store and the SQL seed share identifiers. */
export function seedId(key: string): string {
  const h = createHash("sha1").update(`estatex:${key}`).digest("hex");
  const variant = ((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(18, 20)}-${h.slice(20, 32)}`;
}

export const SEED_AGENTS: Agent[] = [
  {
    id: seedId("agent:aanya"),
    name: "Aanya Mehta",
    title: "Senior Advisor · Ahmedabad",
    bio: "Aanya has spent a decade working alongside architects and families in western India, with a particular eye for courtyard houses and modernist homes.",
    languages: ["English", "Hindi", "Gujarati"],
  },
  {
    id: seedId("agent:meera"),
    name: "Meera Kapoor",
    title: "Advisor · Mumbai",
    bio: "Meera specializes in Mumbai's coastal neighborhoods, from Bandra's hillside lanes to the sea-facing homes of Juhu.",
    languages: ["English", "Hindi", "Marathi"],
  },
  {
    id: seedId("agent:kabir"),
    name: "Kabir Rao",
    title: "Advisor · Bengaluru & Pune",
    bio: "Kabir works with buyers relocating to Bengaluru and Pune, and with weekend-home seekers in the hills around both cities.",
    languages: ["English", "Hindi", "Kannada", "Marathi"],
  },
  {
    id: seedId("agent:ira"),
    name: "Ira Fernandes",
    title: "Advisor · Goa",
    bio: "Born in Saligao, Ira knows North Goa village by village — and which houses stay cool through May.",
    languages: ["English", "Konkani", "Hindi", "Portuguese"],
  },
  {
    id: seedId("agent:vikram"),
    name: "Vikram Sethi",
    title: "Principal Advisor · Delhi",
    bio: "Vikram advises on Delhi's central colonies and farmhouse estates, with twenty years of experience in the city's residential market.",
    languages: ["English", "Hindi", "Punjabi"],
  },
];

const AGENT = Object.fromEntries(SEED_AGENTS.map((a) => [a.name.split(" ")[0]!.toLowerCase(), a.id]));

const FLOOR_PLANS = {
  "house-ground": "/floorplans/house-ground.svg",
  "house-first": "/floorplans/house-first.svg",
  "villa-ground": "/floorplans/villa-ground.svg",
  "villa-first": "/floorplans/villa-first.svg",
  "penthouse-main": "/floorplans/penthouse-main.svg",
  "penthouse-terrace": "/floorplans/penthouse-terrace.svg",
  "apartment-2bhk": "/floorplans/apartment-2bhk.svg",
  "apartment-3bhk": "/floorplans/apartment-3bhk.svg",
  "apartment-4bhk": "/floorplans/apartment-4bhk.svg",
} as const;

type PlanKey = keyof typeof FLOOR_PLANS;

const AIRPORTS: Record<CitySlug, { name: string; lat: number; lng: number }> = {
  ahmedabad: { name: "International airport", lat: 23.0772, lng: 72.6347 },
  mumbai: { name: "International airport", lat: 19.0896, lng: 72.8656 },
  bengaluru: { name: "International airport", lat: 13.1986, lng: 77.7066 },
  goa: { name: "International airport (Mopa)", lat: 15.7406, lng: 73.8642 },
  pune: { name: "International airport", lat: 18.5821, lng: 73.9197 },
  delhi: { name: "International airport", lat: 28.5562, lng: 77.1 },
};

const METRO_NAME: Partial<Record<CitySlug, string>> = {
  mumbai: "Metro station",
  bengaluru: "Namma Metro station",
  delhi: "Delhi Metro station",
  pune: "Pune Metro station",
  ahmedabad: "Metro station",
};

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Pseudo-random but stable distance for illustrative places. */
function stableDistance(key: string, min: number, max: number): number {
  const n = parseInt(createHash("md5").update(key).digest("hex").slice(0, 6), 16) / 0xffffff;
  return Math.round((min + n * (max - min)) * 10) / 10;
}

/**
 * Illustrative neighborhood data. Place names are generic descriptions and
 * distances are demo values (the airport distance is a straight-line estimate
 * from the approximate demo coordinates). The UI labels all of it as demo data.
 */
function buildNearby(slug: string, city: CitySlug, lat: number, lng: number, rural: boolean): NearbyPlace[] {
  const scale = rural ? 4 : 1;
  const d = (key: string, min: number, max: number) => stableDistance(`${slug}:${key}`, min * scale, max * scale);
  const airport = AIRPORTS[city];
  const places: NearbyPlace[] = [
    { category: "schools", name: "International school (IB curriculum)", distanceKm: d("school-ib", 1.2, 4.5) },
    { category: "schools", name: "Senior secondary school", distanceKm: d("school-cbse", 0.6, 2.8) },
    { category: "schools", name: "Montessori pre-school", distanceKm: d("school-pre", 0.3, 1.6) },
    { category: "healthcare", name: "Multi-speciality hospital", distanceKm: d("hospital", 1.5, 5.5) },
    { category: "healthcare", name: "24-hour pharmacy and clinic", distanceKm: d("clinic", 0.3, 1.8) },
    { category: "dining", name: "Neighborhood café", distanceKm: d("cafe", 0.2, 1.2) },
    { category: "dining", name: "Chef-led restaurant", distanceKm: d("restaurant", 0.5, 2.4) },
    { category: "dining", name: "Bakery and deli", distanceKm: d("bakery", 0.3, 1.5) },
    { category: "shopping", name: "Gourmet grocer", distanceKm: d("grocer", 0.4, 2.0) },
    { category: "shopping", name: "Retail and design district", distanceKm: d("retail", 1.2, 4.8) },
    {
      category: "transit",
      name: city === "goa" || rural ? "Railway station" : (METRO_NAME[city] ?? "Metro station"),
      distanceKm: d("metro", 0.6, 3.2),
    },
    {
      category: "transit",
      name: airport.name,
      distanceKm: Math.round(haversineKm(lat, lng, airport.lat, airport.lng) * 10) / 10,
    },
  ];
  return places;
}

interface SeedPropertyDef {
  slug: string;
  name: string;
  tagline: string;
  city: CitySlug;
  locality: string;
  address: string;
  coords: [number, number];
  price: number;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  yearBuilt: number;
  parking: number;
  status: PropertyStatus;
  featured?: boolean;
  rural?: boolean;
  amenities: string[];
  description: string;
  images: [photoId: string, alt: string][];
  floorPlans: [PlanKey, string][];
  agent: string;
  createdAt: string;
}

const DEFS: SeedPropertyDef[] = [
  {
    slug: "the-arbor-house",
    name: "The Arbor House",
    tagline: "A courtyard house arranged around three old neem trees",
    city: "ahmedabad",
    locality: "Shela",
    address: "Off Shela–Bopal Road, Shela, Ahmedabad",
    coords: [23.0034, 72.4552],
    price: 28_000_000,
    type: "house",
    bedrooms: 4,
    bathrooms: 4,
    areaSqft: 3400,
    yearBuilt: 2022,
    parking: 2,
    status: "available",
    featured: true,
    amenities: ["garden", "courtyard", "terrace", "home-office", "smart-home", "security", "power-backup", "parking"],
    description:
      "The Arbor House was designed around what was already on the site: three mature neem trees, now held within a central courtyard that brings shade, birdsong and a changing pattern of light into every room.\n\nLiving spaces open fully to the court on the ground floor, with a timber-lined kitchen and a dining room that becomes a verandah in the cooler months. Upstairs, four bedrooms sit behind deep brick screens that keep the afternoon sun at bay while preserving views of the canopy. A study above the entrance looks out over the treetops.",
    images: [
      ["1600607688969-a5bfcd646154", "The Arbor House at dusk — dark timber volumes beneath a mature tree, with a lawn in the foreground"],
      ["1600607687939-ce8a6c25118c", "Open-plan living room with a walnut feature wall and floor-to-ceiling glazing"],
      ["1600607686527-6fb886090705", "Kitchen with white stone counters, timber cabinetry and black pendant lights"],
      ["1600607687920-4e2a09cf159d", "Dining table beside a floating steel staircase and a wall of glass"],
      ["1600607687644-c7171b42498f", "Bedroom with grey linens and black-framed doors to the garden"],
      ["1600566752355-35792bedcfea", "Bathroom with a freestanding tub beneath a clerestory window"],
    ],
    floorPlans: [
      ["house-ground", "Ground Floor"],
      ["house-first", "First Floor"],
    ],
    agent: "aanya",
    createdAt: "2026-09-18T10:00:00.000Z",
  },
  {
    slug: "the-sabarmati-penthouse",
    name: "The Sabarmati Penthouse",
    tagline: "A double-height residence above the river",
    city: "ahmedabad",
    locality: "Ellisbridge",
    address: "Riverfront, Ellisbridge, Ahmedabad",
    coords: [23.0231, 72.5668],
    price: 46_000_000,
    type: "penthouse",
    bedrooms: 4,
    bathrooms: 5,
    areaSqft: 4800,
    yearBuilt: 2023,
    parking: 3,
    status: "available",
    amenities: ["terrace", "private-lift", "sea-view", "gym", "concierge", "clubhouse", "smart-home", "security", "power-backup", "parking"],
    description:
      "Occupying the top two floors of a slender riverfront building, this penthouse is organized around a double-height living room that frames the Sabarmati and the old city beyond. At dusk the view turns gold, then blue, then to a long line of lights along the promenade.\n\nA private lift opens into a gallery-like entrance. The principal suite occupies its own wing with a dressing room and a bathroom finished in honed marble, while a wraparound terrace on the upper level offers room for an outdoor dining table, planting and a plunge pool.",
    images: [
      ["1564078516393-cf04bd966897", "Double-height living room with floor-to-ceiling windows and a view at dusk"],
      ["1616594039964-ae9021a400a0", "Principal bedroom with an upholstered bed and city views"],
      ["1600585152220-90363fe7e115", "Kitchen with a white island, timber stools and pendant lights"],
      ["1600210491369-e753d80a41f3", "A quiet sitting room with framed artwork and a pale sofa"],
      ["1620626011761-996317b8d101", "Bathroom with a freestanding tub and a window onto planting"],
    ],
    floorPlans: [
      ["penthouse-main", "Main Level"],
      ["penthouse-terrace", "Terrace Level"],
    ],
    agent: "aanya",
    createdAt: "2026-08-02T10:00:00.000Z",
  },
  {
    slug: "kesar-villa",
    name: "Kesar Villa",
    tagline: "A family villa behind a perforated screen",
    city: "ahmedabad",
    locality: "Thaltej",
    address: "Thaltej, Ahmedabad",
    coords: [23.0497, 72.5056],
    price: 54_000_000,
    type: "villa",
    bedrooms: 5,
    bathrooms: 6,
    areaSqft: 6200,
    yearBuilt: 2021,
    parking: 3,
    status: "reserved",
    amenities: ["pool", "garden", "courtyard", "home-theatre", "home-office", "smart-home", "staff-quarters", "security", "power-backup", "parking"],
    description:
      "Kesar Villa presents a calm, almost blank face to the street: a white perforated screen that softens the western sun and becomes, at night, a lantern. Behind it, the house opens to a long garden and a pool lined in green stone.\n\nFive bedrooms are distributed across two levels, each with its own bathroom and a view of the garden. A family room, a home theatre and staff quarters complete a house built for multi-generational living, with the privacy of separate wings and the ease of a shared courtyard.",
    images: [
      ["1600573472592-401b489a3cdc", "The perforated white screen of Kesar Villa above a timber-clad ground floor"],
      ["1600566753190-17f0baa2a6c3", "Entrance court with vertical timber cladding and black steel gates"],
      ["1613545325278-f24b0cae1224", "Double-height living room with a stone fireplace wall"],
      ["1556912172-45b7abe8b7e1", "Kitchen with a marble island and walnut detailing"],
      ["1617325247661-675ab4b64ae2", "Guest bedroom with a low timber bed and linen bedding"],
    ],
    floorPlans: [
      ["villa-ground", "Ground Floor"],
      ["villa-first", "First Floor"],
    ],
    agent: "aanya",
    createdAt: "2026-06-21T10:00:00.000Z",
  },
  {
    slug: "shorelight-house",
    name: "Shorelight House",
    tagline: "A low white house on the edge of the Arabian Sea",
    city: "mumbai",
    locality: "Juhu",
    address: "Juhu Tara Road, Juhu, Mumbai",
    coords: [19.099, 72.826],
    price: 380_000_000,
    type: "waterfront",
    bedrooms: 5,
    bathrooms: 6,
    areaSqft: 6800,
    yearBuilt: 2019,
    parking: 4,
    status: "available",
    amenities: ["sea-view", "terrace", "pool", "garden", "spa", "home-theatre", "staff-quarters", "security", "power-backup", "parking"],
    description:
      "Rare in Mumbai, Shorelight House sits directly on the sand: a low, white, horizontal house with a terrace that steps down towards the sea. Every principal room faces west, and the sound of the water is constant.\n\nInside, pale stone floors and limewashed walls keep the light soft even in the brightest afternoons. The upper level holds four bedrooms and a principal suite with its own terrace, while the ground floor is given over to a long living room, a garden room and a pool screened by sea grape and frangipani.",
    images: [
      ["1597211833712-5e41faa202ea", "Shorelight House — a low white house with a terrace looking out to the sea"],
      ["1615571022219-eb45cf7faa9d", "The house seen from the shoreline as waves roll in"],
      ["1618221195710-dd6b41faaea6", "Living room in warm neutrals with a long window and low furniture"],
      ["1578683010236-d716f9a3f461", "Principal suite with a glass-walled bathroom and views beyond"],
      ["1502005097973-6a7082348e28", "Galley kitchen in pale oak opening onto the garden"],
    ],
    floorPlans: [
      ["villa-ground", "Ground Floor"],
      ["villa-first", "First Floor"],
    ],
    agent: "meera",
    createdAt: "2026-07-14T10:00:00.000Z",
  },
  {
    slug: "pali-hill-penthouse",
    name: "Pali Hill Penthouse",
    tagline: "Terraces, treetops and a view to the sea",
    city: "mumbai",
    locality: "Bandra West",
    address: "Pali Hill, Bandra West, Mumbai",
    coords: [19.0686, 72.8264],
    price: 240_000_000,
    type: "penthouse",
    bedrooms: 4,
    bathrooms: 5,
    areaSqft: 4600,
    yearBuilt: 2022,
    parking: 3,
    status: "available",
    featured: true,
    amenities: ["terrace", "pool", "private-lift", "sea-view", "fireplace", "library", "gym", "concierge", "smart-home", "security", "parking"],
    description:
      "Set at the top of one of Bandra's most sought-after hills, this penthouse looks over a canopy of old trees towards the sea. A sculptural timber staircase rises through the center of the home to a rooftop terrace with a lap pool and an outdoor kitchen.\n\nThe lower level is arranged for both entertaining and retreat: a generous living and dining room with a fireplace, a library, and four bedroom suites, each with a dressing room. Finishes are restrained — oak, lime plaster and bronze — allowing the light and the view to do the work.",
    images: [
      ["1600573472550-8090b5e0745e", "A floating timber staircase beside glazing that opens onto the terrace pool"],
      ["1604014237800-1c9102c219da", "Living and dining room with a timber wall, fireplace and open terrace doors"],
      ["1566665797739-1674de7a421a", "Bedroom with a dark timber headboard and soft evening light"],
      ["1609347744403-2306e8a9ae27", "Kitchen with marble counters and woven dining chairs"],
      ["1584622650111-993a426fbf0a", "Bathroom with a walk-in glass shower and stone vanity"],
    ],
    floorPlans: [
      ["penthouse-main", "Main Level"],
      ["penthouse-terrace", "Terrace Level"],
    ],
    agent: "meera",
    createdAt: "2026-09-10T10:00:00.000Z",
  },
  {
    slug: "the-mill-loft",
    name: "The Mill Loft",
    tagline: "A converted mill apartment with five-meter ceilings",
    city: "mumbai",
    locality: "Lower Parel",
    address: "Senapati Bapat Marg, Lower Parel, Mumbai",
    coords: [18.9985, 72.8302],
    price: 78_000_000,
    type: "apartment",
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 2100,
    yearBuilt: 2020,
    parking: 2,
    status: "reserved",
    amenities: ["home-office", "gym", "clubhouse", "concierge", "security", "power-backup", "parking"],
    description:
      "Within one of Lower Parel's restored textile mills, The Mill Loft keeps the building's best qualities — five-meter ceilings, tall steel windows and exposed timber beams — and adds a calm, contemporary interior.\n\nThe main space combines living, dining and a working kitchen under a single volume, with a mezzanine study above. Three bedrooms are tucked behind a wall of oak joinery. Residents share a gym, a landscaped deck and a 24-hour concierge.",
    images: [
      ["1600210492486-724fe5c67fb0", "Loft living room with a leather sofa, plants and a wall of framed photographs"],
      ["1600494448850-6013c64ba722", "Second sitting area with soft neutral furnishings"],
      ["1600489000022-c2086d79f9d4", "Kitchen with grey cabinetry, open shelving and white tiles"],
      ["1586105251261-72a756497a11", "Bedroom with line drawings above a dark upholstered bed"],
    ],
    floorPlans: [["apartment-3bhk", "Floor Plan"]],
    agent: "meera",
    createdAt: "2026-05-28T10:00:00.000Z",
  },
  {
    slug: "the-granite-house",
    name: "The Granite House",
    tagline: "A weekend house among the boulders below Nandi Hills",
    city: "bengaluru",
    locality: "Nandi Hills",
    address: "Nandi Hills Road, Chikkaballapur District",
    coords: [13.3702, 77.6835],
    price: 45_000_000,
    type: "house",
    bedrooms: 4,
    bathrooms: 4,
    areaSqft: 4200,
    yearBuilt: 2020,
    parking: 2,
    status: "available",
    featured: true,
    rural: true,
    amenities: ["garden", "terrace", "courtyard", "fireplace", "library", "home-office", "ev-charging", "power-backup", "parking"],
    description:
      "An hour north of the city, The Granite House sits among the boulders and scrub forest below Nandi Hills. Its dark timber and concrete volumes are set low into the landscape, with tall windows that glow like lanterns in the evening.\n\nThe plan is simple and generous: a living room with a fireplace for cool winter nights, a kitchen that opens onto a stone terrace, and four bedrooms with views across the valley. Rainwater harvesting and solar power make it a house that asks little of its surroundings.",
    images: [
      ["1600585154363-67eb9e2e2099", "The Granite House at dusk — dark timber volumes with tall lit windows beneath old trees"],
      ["1600566753376-12c8ab7fb75b", "Entrance stair and timber screen lit against the evening sky"],
      ["1613553474179-e1eda3ea5734", "Bedroom with polished plaster walls and pale linen"],
      ["1617228069096-4638a7ffc906", "Kitchen with a long window framing the garden"],
      ["1507652313519-d4e9174996dd", "Stone bathroom with a freestanding tub and a potted palm"],
    ],
    floorPlans: [
      ["house-ground", "Ground Floor"],
      ["house-first", "First Floor"],
    ],
    agent: "kabir",
    createdAt: "2026-09-04T10:00:00.000Z",
  },
  {
    slug: "the-indiranagar-residence",
    name: "The Indiranagar Residence",
    tagline: "A garden apartment on one of the city's leafiest avenues",
    city: "bengaluru",
    locality: "Indiranagar",
    address: "HAL 2nd Stage, Indiranagar, Bengaluru",
    coords: [12.9719, 77.6412],
    price: 36_000_000,
    type: "apartment",
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 2450,
    yearBuilt: 2021,
    parking: 2,
    status: "available",
    amenities: ["garden", "balcony", "gym", "ev-charging", "security", "power-backup", "parking"],
    description:
      "A ground-floor apartment in a boutique building of only six homes, The Indiranagar Residence has something rare in the city center: a private garden, shaded by a rain tree older than the street around it.\n\nLiving and dining rooms open onto a deep verandah, and the bedrooms look into planted courts. Walk to some of the city's best restaurants and independent shops, then return to a home that feels set apart from all of it.",
    images: [
      ["1593696140826-c58b021acf8b", "Bright open-plan living and dining room with white upholstered chairs"],
      ["1616627561839-074385245ff6", "Bedroom with terracotta linens and a timber side table"],
      ["1556911220-bff31c812dba", "Kitchen with white cabinets, marble counters and fresh produce"],
      ["1600210491892-03d54c0aaf87", "Sitting room with arched windows and a fireplace"],
    ],
    floorPlans: [["apartment-3bhk", "Floor Plan"]],
    agent: "kabir",
    createdAt: "2026-07-02T10:00:00.000Z",
  },
  {
    slug: "banyan-court",
    name: "Banyan Court",
    tagline: "A white villa with a long lawn and a pool for laps",
    city: "bengaluru",
    locality: "Whitefield",
    address: "Whitefield, Bengaluru",
    coords: [12.9698, 77.7499],
    price: 62_000_000,
    type: "villa",
    bedrooms: 5,
    bathrooms: 5,
    areaSqft: 5600,
    yearBuilt: 2022,
    parking: 3,
    status: "available",
    amenities: ["pool", "garden", "gym", "clubhouse", "home-office", "smart-home", "ev-charging", "security", "power-backup", "parking"],
    description:
      "Banyan Court is a crisp white villa set behind a lawn in one of Whitefield's quietest gated communities. Its ground floor is almost entirely glass, opening on three sides to the garden and a fifteen-meter lap pool.\n\nUpstairs, five bedrooms are arranged around a central landing filled with daylight from a long skylight. The community offers a clubhouse, tennis courts and a school bus route, with the city's technology parks a short drive away.",
    images: [
      ["1613977257592-4871e5fcd7c4", "A white two-storey villa with a pool and a broad lawn"],
      ["1580587771525-78b9dba3b914", "The villa's pool and terraces seen from the garden"],
      ["1600494448850-6013c64ba722", "Family room with soft neutral furnishings"],
      ["1617325247661-675ab4b64ae2", "Bedroom with a low timber bed and linen bedding"],
      ["1556911220-bff31c812dba", "Kitchen with white cabinets and marble counters"],
    ],
    floorPlans: [
      ["villa-ground", "Ground Floor"],
      ["villa-first", "First Floor"],
    ],
    agent: "kabir",
    createdAt: "2026-08-19T10:00:00.000Z",
  },
  {
    slug: "hebbal-lake-residence",
    name: "Hebbal Lake Residence",
    tagline: "Lakefront living on the airport side of the city",
    city: "bengaluru",
    locality: "Hebbal",
    address: "Hebbal, Bengaluru",
    coords: [13.0453, 77.596],
    price: 48_000_000,
    type: "waterfront",
    bedrooms: 4,
    bathrooms: 4,
    areaSqft: 3300,
    yearBuilt: 2023,
    parking: 2,
    status: "available",
    amenities: ["sea-view", "balcony", "pool", "gym", "clubhouse", "concierge", "security", "power-backup", "parking"],
    description:
      "On the shore of Hebbal Lake, this apartment looks out over open water and a heronry rather than the city. A glass-walled living pavilion connects to a deep terrace, while the residents' pool deck sits level with the treetops.\n\nFour bedrooms, a study and a family room are arranged so that almost every space has a view of the lake. The airport and the northern business districts are within easy reach.",
    images: [
      ["1582268611958-ebfd161ef9cf", "Glass-walled pavilion and pool on the residents' deck"],
      ["1600210491369-e753d80a41f3", "Sitting room with framed art and a pale sofa"],
      ["1582719478250-c89cae4dc85b", "Bedroom with sunlight through tall timber doors"],
      ["1600585152220-90363fe7e115", "Kitchen with a white island and timber stools"],
    ],
    floorPlans: [["apartment-4bhk", "Floor Plan"]],
    agent: "kabir",
    createdAt: "2026-09-24T10:00:00.000Z",
  },
  {
    slug: "casa-verde",
    name: "Casa Verde",
    tagline: "A contemporary tropical residence designed around light, landscape and privacy",
    city: "goa",
    locality: "Assagao",
    address: "Assagao, Bardez, North Goa",
    coords: [15.5958, 73.7656],
    price: 65_000_000,
    type: "villa",
    bedrooms: 4,
    bathrooms: 5,
    areaSqft: 5200,
    yearBuilt: 2021,
    parking: 3,
    status: "available",
    featured: true,
    amenities: ["pool", "garden", "courtyard", "terrace", "spa", "home-office", "staff-quarters", "security", "power-backup", "parking"],
    description:
      "Casa Verde is a contemporary tropical residence designed around light, landscape and privacy. Set within an acre of mature planting in Assagao, its rooms are arranged as a series of pavilions connected by shaded walkways, each opening onto its own garden.\n\nA green-stone pool runs the length of the main lawn, mirroring a canopy of frangipani and areca palms. Deep tiled roofs and laterite walls keep the house cool through the summer; during the monsoon, broad verandahs make the rain part of daily life. Four bedroom suites, a studio and a guest cottage give room for family and friends without ever feeling crowded.",
    images: [
      ["1582610116397-edb318620f90", "Casa Verde's pool pavilion surrounded by tropical planting"],
      ["1613490493576-7fde63acd811", "The main house with its timber soffit reflected in the pool"],
      ["1600566753151-384129cf4e3e", "Living room opening onto the pool terrace"],
      ["1582719478250-c89cae4dc85b", "Bedroom suite with sunlight falling across timber floors"],
      ["1620626011761-996317b8d101", "Bathroom with a freestanding tub and garden view"],
    ],
    floorPlans: [
      ["villa-ground", "Ground Floor"],
      ["villa-first", "First Floor"],
    ],
    agent: "ira",
    createdAt: "2026-08-27T10:00:00.000Z",
  },
  {
    slug: "siolim-riverhouse",
    name: "Siolim Riverhouse",
    tagline: "A house on the Chapora, with a deck over the water",
    city: "goa",
    locality: "Siolim",
    address: "Siolim, Bardez, North Goa",
    coords: [15.6272, 73.7608],
    price: 89_000_000,
    type: "waterfront",
    bedrooms: 5,
    bathrooms: 6,
    areaSqft: 6400,
    yearBuilt: 2018,
    parking: 3,
    status: "available",
    featured: true,
    amenities: ["sea-view", "jetty", "pool", "garden", "terrace", "spa", "staff-quarters", "security", "power-backup", "parking"],
    description:
      "Siolim Riverhouse sits on a bend of the Chapora river, where fishing boats pass in the early morning and the light settles gold in the evening. A timber deck extends over the water from the edge of an infinity pool, with a private jetty below.\n\nThe house itself is a refined interpretation of the Goan villa: thick walls, high ceilings, shuttered windows and verandahs on every side. Five bedrooms, a garden room and an outdoor dining pavilion make it equally suited to a large family or a long season of guests.",
    images: [
      ["1584132967334-10e028bd69f7", "Infinity pool and timber deck extending towards the water beneath palms"],
      ["1613977257363-707ba9348227", "White pavilion with loungers beside the pool"],
      ["1571003123894-1f0594d2b5d9", "Draped cabanas beside the pool at dusk"],
      ["1578683010236-d716f9a3f461", "Principal suite with a glass-walled bathroom"],
      ["1556912172-45b7abe8b7e1", "Kitchen with a marble island and walnut detailing"],
    ],
    floorPlans: [
      ["villa-ground", "Ground Floor"],
      ["villa-first", "First Floor"],
    ],
    agent: "ira",
    createdAt: "2026-09-14T10:00:00.000Z",
  },
  {
    slug: "saltwater-residence",
    name: "Saltwater Residence",
    tagline: "A two-bedroom apartment a short walk from Candolim beach",
    city: "goa",
    locality: "Candolim",
    address: "Candolim, Bardez, North Goa",
    coords: [15.518, 73.7627],
    price: 24_000_000,
    type: "apartment",
    bedrooms: 2,
    bathrooms: 2,
    areaSqft: 1650,
    yearBuilt: 2022,
    parking: 1,
    status: "sold",
    amenities: ["pool", "balcony", "garden", "security", "power-backup", "parking"],
    description:
      "A two-bedroom apartment in a low-rise building of white walls and palm gardens, a short walk from Candolim beach. A wide balcony runs the length of the living room, with views over the shared pool to the coconut groves.\n\nThe interiors are simple and bright — terrazzo floors, cane furniture and a galley kitchen — making it an easy holiday home or a calm base for year-round coastal living.",
    images: [
      ["1512917774080-9991f1c4c750", "White modern building with a pool and palms"],
      ["1616627561839-074385245ff6", "Bedroom with terracotta linens and a timber side table"],
      ["1600489000022-c2086d79f9d4", "Kitchen with grey cabinetry and open shelving"],
    ],
    floorPlans: [["apartment-2bhk", "Floor Plan"]],
    agent: "ira",
    createdAt: "2026-06-05T10:00:00.000Z",
  },
  {
    slug: "ridge-house-lonavala",
    name: "Ridge House",
    tagline: "Stone, glass and the valley below",
    city: "pune",
    locality: "Lonavala",
    address: "Tungarli, Lonavala, Pune District",
    coords: [18.76, 73.4],
    price: 39_000_000,
    type: "house",
    bedrooms: 4,
    bathrooms: 4,
    areaSqft: 3800,
    yearBuilt: 2021,
    parking: 2,
    status: "available",
    rural: true,
    amenities: ["garden", "terrace", "pool", "fireplace", "home-office", "security", "power-backup", "parking"],
    description:
      "Ridge House is set on a hillside above Lonavala, where the monsoon brings waterfalls to the valley and mist through the trees. Its dark-clad upper floor is lifted on a glazed base, so the living spaces feel suspended over the view.\n\nA fireplace anchors the living room, a long terrace runs the width of the house, and four bedrooms each have a window onto the valley. Mumbai is around two hours away; Pune, a little over one.",
    images: [
      ["1600585153490-76fb20a32601", "Ridge House at dusk with tall lit windows above a lawn"],
      ["1600585154526-990dced4db0d", "Timber façade detail lit at night"],
      ["1613545325278-f24b0cae1224", "Double-height living room with a stone fireplace"],
      ["1586105251261-72a756497a11", "Bedroom with line drawings above an upholstered bed"],
    ],
    floorPlans: [
      ["house-ground", "Ground Floor"],
      ["house-first", "First Floor"],
    ],
    agent: "kabir",
    createdAt: "2026-07-23T10:00:00.000Z",
  },
  {
    slug: "koregaon-park-penthouse",
    name: "Koregaon Park Penthouse",
    tagline: "A penthouse among the rain trees",
    city: "pune",
    locality: "Koregaon Park",
    address: "Koregaon Park, Pune",
    coords: [18.5362, 73.894],
    price: 52_000_000,
    type: "penthouse",
    bedrooms: 4,
    bathrooms: 4,
    areaSqft: 3600,
    yearBuilt: 2022,
    parking: 2,
    status: "available",
    amenities: ["terrace", "pool", "private-lift", "gym", "home-office", "smart-home", "security", "power-backup", "parking"],
    description:
      "Above the canopy of Koregaon Park's rain trees, this penthouse pairs a crisp white interior with a courtyard terrace and a plunge pool lit for evenings. Steel-framed glass doors slide away entirely, joining the living room and terrace into a single space.\n\nFour bedrooms, a study and a family room occupy a single level, reached by a private lift. The neighborhood's cafés, bookshops and gardens are a short walk away.",
    images: [
      ["1613553507747-5f8d62ad5904", "Courtyard plunge pool beside steel-framed glass doors at night"],
      ["1600566753086-00f18fb6b3ea", "Living room with an open-tread staircase and garden doors"],
      ["1616594039964-ae9021a400a0", "Principal bedroom with an upholstered bed"],
      ["1600585152220-90363fe7e115", "Kitchen with a white island and timber stools"],
    ],
    floorPlans: [
      ["penthouse-main", "Main Level"],
      ["penthouse-terrace", "Terrace Level"],
    ],
    agent: "kabir",
    createdAt: "2026-06-30T10:00:00.000Z",
  },
  {
    slug: "the-aravalli-estate",
    name: "The Aravalli Estate",
    tagline: "A farmhouse villa on two and a half acres of garden",
    city: "delhi",
    locality: "Chhatarpur",
    address: "Chhatarpur Farms, New Delhi",
    coords: [28.4936, 77.1785],
    price: 320_000_000,
    type: "villa",
    bedrooms: 6,
    bathrooms: 7,
    areaSqft: 12000,
    yearBuilt: 2017,
    parking: 6,
    status: "available",
    amenities: ["pool", "garden", "spa", "gym", "home-theatre", "wine-cellar", "library", "fireplace", "staff-quarters", "ev-charging", "security", "power-backup", "parking"],
    description:
      "The Aravalli Estate occupies two and a half acres of mature garden in Chhatarpur — lawns, a fruit orchard and a grove of old neem and jamun trees. At its center, a white, symmetrical villa looks over a pool set on the main axis of the garden.\n\nSix bedroom suites, a library, a home theatre, a wine room and a spa are distributed across two floors and a lower level. Separate staff quarters and a guest house allow the estate to work as both a family home and a place for hosting at scale.",
    images: [
      ["1600596542815-ffad4c1539a9", "White villa with a sculpted pool and terraces under a blue sky"],
      ["1602343168117-bb8ffe3e2e9f", "Symmetrical façade above broad pool steps"],
      ["1600210491892-03d54c0aaf87", "Drawing room with arched windows and a fireplace"],
      ["1616594039964-ae9021a400a0", "Principal bedroom with an upholstered bed"],
      ["1584622650111-993a426fbf0a", "Bathroom with a walk-in glass shower"],
    ],
    floorPlans: [
      ["villa-ground", "Ground Floor"],
      ["villa-first", "First Floor"],
    ],
    agent: "vikram",
    createdAt: "2026-08-08T10:00:00.000Z",
  },
  {
    slug: "the-golf-links-residence",
    name: "The Golf Links Residence",
    tagline: "A garden-level home in one of Delhi's most established colonies",
    city: "delhi",
    locality: "Golf Links",
    address: "Golf Links, New Delhi",
    coords: [28.6007, 77.2302],
    price: 140_000_000,
    type: "apartment",
    bedrooms: 4,
    bathrooms: 4,
    areaSqft: 3200,
    yearBuilt: 2016,
    parking: 2,
    status: "reserved",
    amenities: ["garden", "terrace", "fireplace", "staff-quarters", "security", "power-backup", "parking"],
    description:
      "On a quiet, tree-lined lane in Golf Links, this garden-level residence occupies the ground floor of a recently rebuilt house, with a private lawn shaded by an old jamun tree.\n\nInteriors are clean-lined and calm: white walls, oak floors and steel-framed windows. Four bedrooms, a formal drawing room and a family kitchen make it a rare central home with space to grow — moments from Lodhi Garden and Khan Market.",
    images: [
      ["1523217582562-09d0def993a6", "A crisp white façade with deep window reveals and planting"],
      ["1600494448850-6013c64ba722", "Drawing room with soft neutral furnishings"],
      ["1617325247661-675ab4b64ae2", "Bedroom with a low timber bed and linen bedding"],
      ["1556912172-45b7abe8b7e1", "Kitchen with a marble island and walnut detailing"],
    ],
    floorPlans: [["apartment-4bhk", "Floor Plan"]],
    agent: "vikram",
    createdAt: "2026-05-12T10:00:00.000Z",
  },
];

/** All Unsplash photo ids referenced by the seed (used by the blur placeholder script). */
export const SEED_PHOTO_IDS = [...new Set(DEFS.flatMap((d) => d.images.map(([id]) => id)))];

export function buildSeedProperties(): Property[] {
  const agents = new Map(SEED_AGENTS.map((a) => [a.id, a]));
  return DEFS.map((def) => {
    const id = seedId(`property:${def.slug}`);
    const images = def.images.map(([photoId, alt], position) => ({
      id: seedId(`image:${def.slug}:${position}`),
      url: unsplash(photoId),
      alt,
      position,
      blurDataUrl: BLUR[photoId] ?? null,
    }));
    const agentId = AGENT[def.agent] ?? null;
    return {
      id,
      slug: def.slug,
      name: def.name,
      tagline: def.tagline,
      description: def.description,
      city: def.city,
      locality: def.locality,
      address: def.address,
      latitude: def.coords[0],
      longitude: def.coords[1],
      price: def.price,
      type: def.type,
      bedrooms: def.bedrooms,
      bathrooms: def.bathrooms,
      areaSqft: def.areaSqft,
      yearBuilt: def.yearBuilt,
      parking: def.parking,
      status: def.status,
      featured: def.featured ?? false,
      amenities: def.amenities,
      images,
      cover: images[0] ?? null,
      floorPlans: def.floorPlans.map(([key, label], position) => ({
        id: seedId(`plan:${def.slug}:${position}`),
        url: FLOOR_PLANS[key],
        label,
        position,
      })),
      nearby: buildNearby(def.slug, def.city, def.coords[0], def.coords[1], def.rural ?? false),
      agentId,
      agent: agentId ? (agents.get(agentId) ?? null) : null,
      createdAt: def.createdAt,
      updatedAt: def.createdAt,
    } satisfies Property;
  });
}
