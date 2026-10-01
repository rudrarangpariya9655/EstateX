# EstateX

A luxury real-estate platform for discovering distinctive homes across India — built as a portfolio project
that behaves like a real product. Editorial and calm on the surface; search, maps, favorites, comparison,
visit scheduling, authentication, a user dashboard and a full admin underneath.

> **Demo content.** Every residence, price, agent and neighborhood figure is illustrative seed data — not
> live listings or market information. Demonstration photography comes from Unsplash and does not depict the
> fictional homes described.

## Highlights

| Area | What's there |
| --- | --- |
| **Discovery** | URL-driven search (shareable, back-button friendly), keyword search with city aliases, quick filters, an advanced-filters drawer with a live result count, four sort orders, grid and map views, pagination, `/` keyboard shortcut for a global search overlay |
| **Property pages** | Editorial gallery with an accessible lightbox (keyboard, swipe, Escape), specifications, amenities with progressive disclosure, floor-plan tabs with enlarge, neighborhood map with demo-labelled nearby places, EMI calculator, advisor profile, visit request form, similar homes |
| **Favorites** | Hearts work everywhere; saved on the device for guests and moved into the account on sign-in; persisted to the database when signed in |
| **Comparison** | Up to three homes in a semantic table with a sticky label column, "best value" hints, shared vs. unique amenities, horizontal scrolling on phones, shareable URLs |
| **Visits** | Validated requests (no past dates, 90-day window, time slots), stored as *pending* — the UI says "Visit request received", never "confirmed", until an admin confirms |
| **Accounts** | Sign in, sign up, forgot/reset password, profile and password change, dashboard with saved homes, visit requests (with cancellation), recently viewed |
| **Admin** | Overview, property CRUD with client + server validation, image and floor-plan uploads with alt text and ordering, status (Available / Reserved / Sold), featured toggle, confirmed deletes, visit review, inquiries, user roles |
| **Editorial** | Homepage storytelling, About, Neighborhoods + six city guides, Collections, Contact, List your property, Privacy, Terms |

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions, `proxy.ts`) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS 4** — design tokens in `src/app/globals.css`
- **Supabase** — Postgres with row-level security, Auth, Storage
- **Cloudinary** (optional) for image uploads · **Leaflet** with OpenStreetMap or Mapbox tiles
- **Zod** for validation shared by client and server · **Vitest** + **PGlite** for tests
- No animation library: motion is CSS (transform/opacity, `cubic-bezier(0.16, 1, 0.3, 1)`) plus a tiny IntersectionObserver, and respects `prefers-reduced-motion`

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

No configuration is needed to explore it. Without Supabase credentials EstateX runs in **demo mode**: a local
JSON database in `.data/` (seeded on first run) and signed, httpOnly cookie sessions with scrypt-hashed passwords.

**Demo accounts** (demo mode, development only): the sign-in page offers one-click *Visitor* and
*Administrator* buttons.

| Role | Email | Password |
| --- | --- | --- |
| Visitor | `guest@estatex.demo` | `estatex-guest-2026` |
| Administrator | `admin@estatex.demo` | `estatex-admin-2026` |

To make your own account an admin in demo mode, list its email in `ESTATEX_ADMIN_EMAILS`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | Generate route types, then `tsc --noEmit` |
| `npm test` | Vitest suites |
| `npm run check` | Lint + typecheck + tests |
| `npm run db:seed-sql` | Regenerate `supabase/seed.sql` from `src/lib/data/seed.ts` |

## Configuration

Copy `.env.example` to `.env.local`. Every integration is optional and has a graceful fallback.

### Supabase (database, auth, storage)

1. Create a project and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   (or the legacy anon key as `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
2. Run `supabase/migrations/20261001000000_init.sql`, then `supabase/seed.sql`, in the SQL editor
   (or `supabase db push`). The migration creates tables, indexes, triggers, RLS policies and a public
   `property-images` storage bucket writable only by admins.
3. **Auth → URL configuration:** set the Site URL to `NEXT_PUBLIC_SITE_URL` and add
   `<site-url>/auth/callback` as a redirect URL (used by email confirmation and password recovery).
4. **Creating an admin:** sign up in the app, then run in the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
   After that, admins can promote others from **Admin → Users**.

### Images

Admin uploads are checked by magic bytes (JPEG, PNG, WebP, AVIF; SVG is refused) and capped at 8 MB, then stored in
the first available target:

1. **Cloudinary** when `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are set (signed uploads).
2. **Supabase Storage** (`property-images` bucket) when Supabase is configured.
3. **Local disk** (`.data/uploads`, served by `/api/uploads/*`) in demo mode.

The admin overview shows which target is active.

### Maps

Without a token the map uses OpenStreetMap tiles, toned to the palette. Set `NEXT_PUBLIC_MAPBOX_TOKEN` for Mapbox
tiles (recommended for production traffic). If tiles fail to load, markers still render on a blank map with a notice;
if the map cannot initialise, an "unavailable" state appears and listings stay usable.

### Production in demo mode

`next start` without Supabase requires `ESTATEX_AUTH_SECRET` (32+ characters) for session signing. Demo
accounts are off in production unless `ESTATEX_DEMO_ACCOUNTS=true`. The local store writes to disk and is
single-process — fine for a demo server, **not** for serverless hosts such as Vercel, where you should connect Supabase.

## Architecture

```
src/
  app/                    routes (App Router)
    (auth)/               sign-in, sign-up, forgot/reset password — shared split layout
    properties/           (catalogue)/ list with loading/error states · [slug]/ detail
    dashboard/ admin/     protected areas (server-verified in every page and action)
    actions/              server actions: auth, visits, inquiries, account, admin
    api/                  session, favorites, search, counts, uploads
    sitemap.ts robots.ts opengraph-image.tsx icon.svg …
  components/             ui primitives, layout, home, property, search, map, admin, dashboard
  lib/
    data/                 DataStore interface + Supabase and local implementations, seed data
    auth/                 AuthService interface + Supabase and local implementations
    search/filters.ts     URL ⇄ search state, matching, sorting, human-readable summaries
    validation.ts         Zod schemas shared by forms and server
  proxy.ts                session refresh + early redirect for /dashboard and /admin
supabase/                 migration and generated seed
tests/                    unit and integration tests
```

- **One persistence contract** (`DataStore`) with two implementations, so every page, action and route works
  identically in demo mode and on Supabase.
- **Defence in depth:** `proxy.ts` redirects signed-out visitors early, but each protected page calls
  `requireUser`/`requireAdmin`, each admin action re-checks the role, and on Supabase every query runs as the
  user under row-level security. Role changes go through a `SECURITY DEFINER` function.
- **Never trust the client:** all forms are re-validated server-side with the same Zod schemas; IDs are checked
  as UUIDs; state-changing API routes reject cross-origin requests; auth, visit, inquiry and upload endpoints are
  rate-limited; forms carry a honeypot field.
- **Caching:** catalogue pages are statically generated and revalidated hourly; admin mutations revalidate them
  immediately. Account-specific state (session, favorites) is fetched client-side so public pages stay cacheable.

## Design system

Warm ivory (`#F4F1EA`) ground, near-black ink, muted grey secondary text, hairline borders and a single accent —
deep forest green (`#24392C`). Instrument Serif for statements, headings and property names; Geist for navigation,
controls, metadata and product UI. Fluid `clamp()` type scale; section rhythm of roughly 64–96px on phones,
80–120px on tablets and 120–176px on desktop. Advanced functionality lives in drawers, dialogs, tabs, disclosures
and dedicated pages so screens stay calm.

## Quality

- **Tests:** search parsing/matching/sorting, EMI maths, formatting and IST dates, validation rules (visits,
  passwords, inquiries, property form, unsafe image URLs), upload sniffing, local-store CRUD/favorites/visits,
  session-token tampering, and the real SQL migration + seed run against embedded Postgres with RLS checks per role.
- **Accessibility:** semantic landmarks and headings, skip link, visible focus styles, native `<dialog>` modals with
  focus return, labelled form fields with linked errors, keyboard-operable tabs, gallery and lightbox, 44px touch
  targets, alt text required for uploaded images, reduced-motion support.
- **SEO:** per-page metadata and canonical URLs, Open Graph images (property covers, generated default card),
  sitemap, robots rules that keep private areas out of the index, breadcrumb and website structured data. No offer
  or business structured data is emitted, because the listings are fictional.
- **Responsive QA:** audited at 1920, 1440, 1366, 1024, 768, 430, 390 and 360px for horizontal overflow, touch-target
  size and console errors across public, account and admin routes.

## Known limitations

- Demo-mode persistence is a single JSON file — use Supabase for anything multi-instance or serverless.
- The in-memory rate limiter is per server instance; use a shared store (e.g. Redis) at scale.
- Demo mode has no email service: password-reset links are printed to the server console.
- Neighborhood "nearby places" are illustrative and not verified.
