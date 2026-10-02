import { describe, expect, it } from "vitest";
import { inquirySchema, passwordSchema, propertySchema, visitRequestSchema } from "@/lib/validation";
import { sniffImageType } from "@/lib/uploads";

const visit = {
  propertyId: "8f3c3c1e-2a6b-5d4e-9f00-112233445566",
  name: "Asha Rao",
  email: "ASHA@example.com ",
  phone: "+91 98200 12345",
  preferredDate: "2026-10-05",
  preferredTime: "11:30",
  message: "",
  website: "",
};

describe("visit requests", () => {
  const schema = visitRequestSchema("2026-10-01");

  it("accepts a valid request and normalises email", () => {
    const parsed = schema.parse(visit);
    expect(parsed.email).toBe("asha@example.com");
  });

  it("rejects past dates, far-future dates and unknown slots", () => {
    expect(schema.safeParse({ ...visit, preferredDate: "2026-09-30" }).success).toBe(false);
    expect(schema.safeParse({ ...visit, preferredDate: "2027-06-01" }).success).toBe(false);
    expect(schema.safeParse({ ...visit, preferredTime: "03:00" }).success).toBe(false);
  });

  it("rejects bots that fill the honeypot", () => {
    expect(schema.safeParse({ ...visit, website: "http://spam" }).success).toBe(false);
  });

  it("rejects short phone numbers", () => {
    expect(schema.safeParse({ ...visit, phone: "12345" }).success).toBe(false);
  });
});

describe("passwords", () => {
  it("requires length, a letter and a number", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("longpassword").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("courtyard-2026").success).toBe(true);
  });
});

describe("inquiries", () => {
  const base = { name: "Dev Shah", email: "dev@example.com", phone: "", message: "Looking for a villa near the river." };
  it("requires city and type for listing enquiries only", () => {
    expect(inquirySchema.safeParse({ ...base, topic: "general" }).success).toBe(true);
    const listing = inquirySchema.safeParse({ ...base, topic: "listing" });
    expect(listing.success).toBe(false);
    expect(listing.error?.issues.map((i) => i.path[0]).sort()).toEqual(["city", "propertyType"]);
    expect(inquirySchema.safeParse({ ...base, topic: "listing", city: "goa", propertyType: "villa" }).success).toBe(true);
  });
});

describe("property form", () => {
  const property = {
    name: "Test House",
    slug: "test-house",
    tagline: "",
    description: "A considered family home arranged around a planted courtyard.",
    price: "31500000",
    city: "ahmedabad",
    locality: "Bodakdev",
    address: "",
    latitude: "23.03",
    longitude: "72.53",
    type: "house",
    bedrooms: "4",
    bathrooms: "4",
    areaSqft: "3600",
    yearBuilt: null,
    parking: "2",
    amenities: ["pool", "pool"],
    status: "available",
    featured: false,
    agentId: null,
    images: [{ url: "/api/uploads/0ba3972e-ad55-459d-8815-aac457f8c001.jpg", alt: "Courtyard at dusk" }],
    floorPlans: [],
  };

  it("coerces numbers and de-duplicates amenities", () => {
    const parsed = propertySchema.parse(property);
    expect(parsed.price).toBe(31_500_000);
    expect(parsed.amenities).toEqual(["pool"]);
  });

  it("rejects unsafe image URLs, bad slugs, unknown amenities and out-of-India coordinates", () => {
    expect(propertySchema.safeParse({ ...property, images: [{ url: "javascript:alert(1)", alt: "x x x" }] }).success).toBe(false);
    expect(propertySchema.safeParse({ ...property, images: [{ url: "http://insecure.example/a.jpg", alt: "x x x" }] }).success).toBe(false);
    expect(propertySchema.safeParse({ ...property, slug: "Bad Slug!" }).success).toBe(false);
    expect(propertySchema.safeParse({ ...property, amenities: ["moat"] }).success).toBe(false);
    expect(propertySchema.safeParse({ ...property, latitude: "51.5" }).success).toBe(false);
    expect(propertySchema.safeParse({ ...property, images: [] }).success).toBe(false);
  });
});

describe("upload sniffing", () => {
  const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);
  const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

  it("identifies real image formats by magic bytes", () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(sniffImageType(bytes(0x89, ...ascii("PNG"), 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(sniffImageType(bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")))).toBe("image/webp");
    expect(sniffImageType(bytes(0, 0, 0, 0x1c, ...ascii("ftypavif")))).toBe("image/avif");
  });

  it("rejects SVG and other content regardless of filename", () => {
    expect(sniffImageType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'))).toBeNull();
    expect(sniffImageType(new TextEncoder().encode("GIF89a"))).toBeNull();
  });
});
