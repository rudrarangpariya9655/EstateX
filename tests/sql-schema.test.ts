/**
 * Runs the real Supabase migration + generated seed against an embedded
 * Postgres (PGlite) with a minimal shim of Supabase's `auth` and `storage`
 * schemas, then exercises the row-level security policies as different roles.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildSeedSql } from "../scripts/generate-seed-sql";
import { buildSeedProperties } from "@/lib/data/seed";

const SUPABASE_SHIM = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text not null, public boolean default false);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
`;

const ADMIN = "11111111-1111-4111-8111-111111111111";
const USER = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";

let db: PGlite;

async function as<T>(role: "anon" | "authenticated", sub: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${sub ?? ""}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_SHIM);
  const dir = join(import.meta.dirname, "..", "supabase", "migrations");
  for (const file of readdirSync(dir).sort()) {
    await db.exec(readFileSync(join(dir, file), "utf8"));
  }
  await db.exec(buildSeedSql());
  await db.exec(`
    insert into auth.users (id, email, raw_user_meta_data) values
      ('${ADMIN}', 'admin@estatex.test', '{"full_name":"Admin"}'),
      ('${USER}', 'user@estatex.test', '{"full_name":"Asha Iyer"}'),
      ('${OTHER}', 'other@estatex.test', '{}');
    update public.profiles set role = 'admin' where id = '${ADMIN}';
  `);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("schema and seed", () => {
  it("loads every seed property with images, plans and amenities", async () => {
    const seed = buildSeedProperties();
    const { rows } = await db.query<{ count: number }>("select count(*)::int as count from public.properties");
    expect(rows[0]!.count).toBe(seed.length);
    const plans = await db.query<{ count: number }>(
      "select count(*)::int as count from public.property_images where kind = 'floor_plan'",
    );
    expect(plans.rows[0]!.count).toBe(seed.reduce((n, p) => n + p.floorPlans.length, 0));
  });

  it("creates a profile for each new auth user via trigger", async () => {
    const { rows } = await db.query<{ full_name: string; role: string }>(
      `select full_name, role from public.profiles where id = '${USER}'`,
    );
    expect(rows[0]).toEqual({ full_name: "Asha Iyer", role: "user" });
  });

  it("exposes cover images and aggregated amenities through property_listings", async () => {
    const { rows } = await db.query<{ cover_url: string; amenity_slugs: string[]; search_text: string }>(
      "select cover_url, amenity_slugs, search_text from public.property_listings where slug = 'casa-verde'",
    );
    expect(rows[0]!.cover_url).toContain("images.unsplash.com");
    expect(rows[0]!.amenity_slugs).toContain("pool");
    expect(rows[0]!.search_text).toContain("assagao");
  });

  it("maintains updated_at on update", async () => {
    const before = await db.query<{ updated_at: string }>(
      "select updated_at from public.properties where slug = 'kesar-villa'",
    );
    await db.exec("update public.properties set featured = true where slug = 'kesar-villa'");
    const after = await db.query<{ updated_at: string }>(
      "select updated_at from public.properties where slug = 'kesar-villa'",
    );
    expect(new Date(after.rows[0]!.updated_at).getTime()).toBeGreaterThan(
      new Date(before.rows[0]!.updated_at).getTime(),
    );
  });
});

describe("row-level security", () => {
  it("lets anyone read the public catalogue", async () => {
    const rows = await as("anon", null, () =>
      db.query<{ count: number }>("select count(*)::int as count from public.property_listings"),
    );
    expect(rows.rows[0]!.count).toBeGreaterThan(10);
  });

  it("blocks non-admins from writing properties", async () => {
    await expect(
      as("authenticated", USER, () => db.exec("update public.properties set price = 1 where slug = 'casa-verde'")),
    ).resolves.toBeDefined();
    const { rows } = await db.query<{ price: number }>("select price from public.properties where slug = 'casa-verde'");
    expect(Number(rows[0]!.price)).not.toBe(1); // RLS filtered the update to zero rows

    await expect(
      as("authenticated", USER, () =>
        db.exec(
          "insert into public.properties (slug, name, city, locality, latitude, longitude, price, type, bedrooms, bathrooms, area_sqft) values ('x-y', 'Test', 'goa', 'Assagao', 15, 73, 100, 'villa', 1, 1, 100)",
        ),
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("allows admins to manage properties", async () => {
    await as("authenticated", ADMIN, () =>
      db.exec("update public.properties set status = 'reserved' where slug = 'banyan-court'"),
    );
    const { rows } = await db.query<{ status: string }>("select status from public.properties where slug = 'banyan-court'");
    expect(rows[0]!.status).toBe("reserved");
  });

  it("saves a property atomically through save_property (admin only)", async () => {
    const payload = {
      slug: "test-garden-house",
      name: "Test Garden House",
      tagline: "A test",
      description: "Created by the schema test.",
      city: "pune",
      locality: "Baner",
      address: "Baner, Pune",
      latitude: 18.56,
      longitude: 73.78,
      price: 31000000,
      type: "house",
      bedrooms: 3,
      bathrooms: 3,
      areaSqft: 2800,
      yearBuilt: 2024,
      parking: 2,
      status: "available",
      featured: false,
      agentId: null,
      amenities: ["garden", "pool", "garden"],
      images: [
        { url: "https://images.unsplash.com/photo-a", alt: "Front" },
        { url: "https://images.unsplash.com/photo-b", alt: "Garden" },
      ],
      floorPlans: [{ url: "/floorplans/house-ground.svg", label: "Ground Floor" }],
    };
    const json = JSON.stringify(payload).replace(/'/g, "''");
    await expect(
      as("authenticated", USER, () => db.query(`select public.save_property('${json}'::jsonb)`)),
    ).rejects.toThrow(/Only administrators/);

    const created = await as("authenticated", ADMIN, () =>
      db.query<{ id: string }>(`select public.save_property('${json}'::jsonb) as id`),
    );
    const id = created.rows[0]!.id;
    const listing = await db.query<{ cover_alt: string; amenity_slugs: string[] }>(
      `select cover_alt, amenity_slugs from public.property_listings where id = '${id}'`,
    );
    expect(listing.rows[0]).toEqual({ cover_alt: "Front", amenity_slugs: ["garden", "pool"] });

    await db.exec(`update public.property_images set blur_data_url = 'data:blur' where property_id = '${id}' and alt = 'Garden'`);
    const updated = JSON.stringify({ ...payload, price: 29000000, images: [payload.images[1]], amenities: ["terrace"] }).replace(/'/g, "''");
    await as("authenticated", ADMIN, () => db.query(`select public.save_property('${updated}'::jsonb, '${id}')`));
    const images = await db.query<{ url: string; position: number; blur_data_url: string | null }>(
      `select url, position, blur_data_url from public.property_images where property_id = '${id}' and kind = 'photo'`,
    );
    expect(images.rows).toEqual([{ url: "https://images.unsplash.com/photo-b", position: 0, blur_data_url: "data:blur" }]);

    await expect(
      as("authenticated", ADMIN, () =>
        db.query(`select public.save_property('${updated}'::jsonb, '00000000-0000-4000-8000-000000000000')`),
      ),
    ).rejects.toThrow(/not found/);
  });

  it("keeps favourites private to their owner", async () => {
    const propertyId = buildSeedProperties()[0]!.id;
    await as("authenticated", USER, () =>
      db.exec(`insert into public.favorites (user_id, property_id) values ('${USER}', '${propertyId}')`),
    );
    await expect(
      as("authenticated", USER, () =>
        db.exec(`insert into public.favorites (user_id, property_id) values ('${OTHER}', '${propertyId}')`),
      ),
    ).rejects.toThrow(/row-level security/i);
    const seenByOther = await as("authenticated", OTHER, () =>
      db.query<{ count: number }>("select count(*)::int as count from public.favorites"),
    );
    expect(seenByOther.rows[0]!.count).toBe(0);
  });

  it("prevents users from escalating their own role", async () => {
    await expect(
      as("authenticated", USER, () => db.exec(`update public.profiles set role = 'admin' where id = '${USER}'`)),
    ).rejects.toThrow(/permission denied/i);
    await expect(
      as("authenticated", USER, () => db.exec(`select public.set_user_role('${USER}', 'admin')`)),
    ).rejects.toThrow(/Only administrators/);
    await as("authenticated", USER, () =>
      db.exec(`update public.profiles set full_name = 'Asha R. Iyer' where id = '${USER}'`),
    );
    const { rows } = await db.query<{ full_name: string; role: string }>(
      `select full_name, role from public.profiles where id = '${USER}'`,
    );
    expect(rows[0]).toEqual({ full_name: "Asha R. Iyer", role: "user" });
  });

  it("lets admins change roles through set_user_role but not demote themselves", async () => {
    await as("authenticated", ADMIN, () => db.exec(`select public.set_user_role('${OTHER}', 'admin')`));
    await expect(
      as("authenticated", ADMIN, () => db.exec(`select public.set_user_role('${ADMIN}', 'user')`)),
    ).rejects.toThrow(/own administrator role/);
  });

  it("accepts guest visit requests, rejects sold residences and hides others' requests", async () => {
    const seed = buildSeedProperties();
    const available = seed.find((p) => p.status === "available")!;
    const sold = seed.find((p) => p.status === "sold")!;
    await as("anon", null, () =>
      db.exec(
        `insert into public.visit_requests (reference, property_id, name, email, phone, preferred_date, preferred_time)
         values ('EX-GUEST1', '${available.id}', 'Guest Visitor', 'guest@example.com', '+91 98200 00000', current_date + 3, '11:30')`,
      ),
    );
    await expect(
      as("anon", null, () =>
        db.exec(
          `insert into public.visit_requests (reference, property_id, name, email, phone, preferred_date, preferred_time)
           values ('EX-GUEST2', '${sold.id}', 'Guest Visitor', 'guest@example.com', '+91 98200 00000', current_date + 3, '11:30')`,
        ),
      ),
    ).rejects.toThrow(/sold/);
    await as("authenticated", USER, () =>
      db.exec(
        `insert into public.visit_requests (reference, property_id, user_id, name, email, phone, preferred_date, preferred_time)
         values ('EX-USER01', '${available.id}', '${USER}', 'Asha Iyer', 'user@estatex.test', '+91 98200 11111', current_date + 5, '14:30')`,
      ),
    );
    const own = await as("authenticated", USER, () =>
      db.query<{ reference: string }>("select reference from public.visit_requests"),
    );
    expect(own.rows.map((r) => r.reference)).toEqual(["EX-USER01"]);
    const all = await as("authenticated", ADMIN, () =>
      db.query<{ count: number }>("select count(*)::int as count from public.visit_requests"),
    );
    expect(all.rows[0]!.count).toBe(2);
  });

  it("lets owners cancel their request but not alter other fields or approve it", async () => {
    await expect(
      as("authenticated", USER, () => db.exec("update public.visit_requests set name = 'Changed'")),
    ).rejects.toThrow(/permission denied/i);
    await as("authenticated", USER, () =>
      db.exec("update public.visit_requests set status = 'confirmed' where reference = 'EX-USER01'"),
    ).catch(() => undefined);
    let { rows } = await db.query<{ status: string }>(
      "select status from public.visit_requests where reference = 'EX-USER01'",
    );
    expect(rows[0]!.status).toBe("pending");
    await as("authenticated", USER, () =>
      db.exec("update public.visit_requests set status = 'cancelled' where reference = 'EX-USER01'"),
    );
    ({ rows } = await db.query<{ status: string }>(
      "select status from public.visit_requests where reference = 'EX-USER01'",
    ));
    expect(rows[0]!.status).toBe("cancelled");
  });

  it("accepts inquiries from anyone but only admins can read them", async () => {
    await as("anon", null, () =>
      db.exec(
        "insert into public.inquiries (name, email, message) values ('Ravi Shah', 'ravi@example.com', 'I would like to list my home in Goa.')",
      ),
    );
    const anonRead = await as("authenticated", USER, () =>
      db.query<{ count: number }>("select count(*)::int as count from public.inquiries"),
    );
    expect(anonRead.rows[0]!.count).toBe(0);
    const adminRead = await as("authenticated", ADMIN, () =>
      db.query<{ count: number }>("select count(*)::int as count from public.inquiries"),
    );
    expect(adminRead.rows[0]!.count).toBe(1);
  });
});
