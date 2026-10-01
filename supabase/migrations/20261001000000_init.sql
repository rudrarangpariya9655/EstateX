-- ════════════════════════════════════════════════════════════════════════════
-- EstateX — initial schema
-- Run in the Supabase SQL editor (or `supabase db push`), then run seed.sql.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Enumerations ────────────────────────────────────────────────────────────
create type public.property_type   as enum ('apartment', 'villa', 'penthouse', 'house', 'waterfront');
create type public.property_status as enum ('available', 'reserved', 'sold');
create type public.visit_status    as enum ('pending', 'confirmed', 'declined', 'completed', 'cancelled');
create type public.user_role       as enum ('user', 'admin');
create type public.inquiry_topic   as enum ('general', 'listing');

-- ── Profiles (1:1 with auth.users) ──────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text not null default '' check (char_length(full_name) <= 100),
  phone      text check (phone is null or char_length(phone) <= 20),
  role       public.user_role not null default 'user',
  created_at timestamptz not null default now()
);

-- ── Agents ──────────────────────────────────────────────────────────────────
create table public.agents (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  title      text not null,
  bio        text not null default '',
  languages  text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ── Amenity catalogue ───────────────────────────────────────────────────────
create table public.amenities (
  slug  text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null,
  icon  text not null
);

-- ── Properties ──────────────────────────────────────────────────────────────
create table public.properties (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name        text not null check (char_length(name) between 2 and 120),
  tagline     text not null default '' check (char_length(tagline) <= 160),
  description text not null default '' check (char_length(description) <= 6000),
  city        text not null check (city in ('ahmedabad', 'mumbai', 'bengaluru', 'goa', 'pune', 'delhi')),
  locality    text not null check (char_length(locality) between 2 and 80),
  address     text not null default '' check (char_length(address) <= 200),
  latitude    double precision not null check (latitude between -90 and 90),
  longitude   double precision not null check (longitude between -180 and 180),
  price       bigint not null check (price > 0),
  type        public.property_type not null,
  bedrooms    smallint not null check (bedrooms between 0 and 50),
  bathrooms   smallint not null check (bathrooms between 0 and 50),
  area_sqft   integer not null check (area_sqft > 0),
  year_built  smallint check (year_built between 1800 and 2100),
  parking     smallint not null default 0 check (parking between 0 and 50),
  status      public.property_status not null default 'available',
  featured    boolean not null default false,
  -- Illustrative neighbourhood data: [{ "category": "...", "name": "...", "distanceKm": 1.2 }]
  nearby      jsonb not null default '[]'::jsonb check (jsonb_typeof(nearby) = 'array'),
  agent_id    uuid references public.agents (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index properties_city_idx     on public.properties (city);
create index properties_type_idx     on public.properties (type);
create index properties_price_idx    on public.properties (price);
create index properties_status_idx   on public.properties (status);
create index properties_created_idx  on public.properties (created_at desc);
create index properties_featured_idx on public.properties (featured) where featured;
create index properties_agent_idx    on public.properties (agent_id);

-- ── Property images & floor plans ───────────────────────────────────────────
create table public.property_images (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties (id) on delete cascade,
  url           text not null check (url ~ '^(https://|/)'),
  alt           text not null default '' check (char_length(alt) <= 200),
  kind          text not null default 'photo' check (kind in ('photo', 'floor_plan')),
  label         text check (label is null or char_length(label) <= 60),
  position      smallint not null default 0,
  blur_data_url text check (blur_data_url is null or char_length(blur_data_url) <= 4000),
  created_at    timestamptz not null default now()
);

create index property_images_property_idx on public.property_images (property_id, kind, position);

-- ── Property ↔ amenity ─────────────────────────────────────────────────────
create table public.property_amenities (
  property_id  uuid not null references public.properties (id) on delete cascade,
  amenity_slug text not null references public.amenities (slug) on delete cascade,
  primary key (property_id, amenity_slug)
);

create index property_amenities_amenity_idx on public.property_amenities (amenity_slug);

-- ── Favourites ──────────────────────────────────────────────────────────────
create table public.favorites (
  user_id     uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, property_id)
);

create index favorites_property_idx on public.favorites (property_id);
create index favorites_user_created_idx on public.favorites (user_id, created_at desc);

-- ── Visit requests ──────────────────────────────────────────────────────────
create table public.visit_requests (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique,
  property_id    uuid not null references public.properties (id) on delete cascade,
  user_id        uuid references auth.users (id) on delete set null,
  name           text not null check (char_length(name) between 2 and 100),
  email          text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  phone          text not null check (char_length(phone) between 7 and 20),
  preferred_date date not null,
  preferred_time text not null check (preferred_time ~ '^\d{2}:\d{2}$'),
  message        text not null default '' check (char_length(message) <= 1000),
  status         public.visit_status not null default 'pending',
  created_at     timestamptz not null default now()
);

create index visit_requests_user_idx     on public.visit_requests (user_id, created_at desc);
create index visit_requests_property_idx on public.visit_requests (property_id);
create index visit_requests_status_idx   on public.visit_requests (status, created_at desc);

-- ── Recently viewed ─────────────────────────────────────────────────────────
create table public.recently_viewed (
  user_id     uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  viewed_at   timestamptz not null default now(),
  primary key (user_id, property_id)
);

create index recently_viewed_user_idx on public.recently_viewed (user_id, viewed_at desc);

-- ── Inquiries (contact form + list-your-property) ───────────────────────────
create table public.inquiries (
  id         uuid primary key default gen_random_uuid(),
  topic      public.inquiry_topic not null default 'general',
  name       text not null check (char_length(name) between 2 and 100),
  email      text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  phone      text check (phone is null or char_length(phone) <= 20),
  message    text not null check (char_length(message) between 10 and 2000),
  details    jsonb,
  created_at timestamptz not null default now()
);

create index inquiries_created_idx on public.inquiries (created_at desc);

-- ════════════════════════════════════════════════════════════════════════════
-- Functions & triggers
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- Create a profile row whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(left(new.raw_user_meta_data ->> 'full_name', 100), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role check used by RLS policies. SECURITY DEFINER avoids recursive RLS on profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Admin-only role management (profiles.role is not directly writable by clients).
create or replace function public.set_user_role(target uuid, new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can change roles' using errcode = '42501';
  end if;
  if target = (select auth.uid()) and new_role <> 'admin' then
    raise exception 'You cannot remove your own administrator role' using errcode = '22023';
  end if;
  update public.profiles set role = new_role where id = target;
end;
$$;

revoke execute on function public.set_user_role(uuid, public.user_role) from public, anon;
grant execute on function public.set_user_role(uuid, public.user_role) to authenticated;

-- Visit requests cannot be created for sold residences.
create or replace function public.check_visit_property()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.properties where id = new.property_id and status = 'sold') then
    raise exception 'This residence has been sold' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger visit_requests_check_property
  before insert on public.visit_requests
  for each row execute function public.check_visit_property();

-- Create or update a property with its images, floor plans and amenities in a
-- single transaction. SECURITY INVOKER: row-level security still applies, so
-- only administrators can write. Existing blur placeholders are preserved for
-- images whose URL is unchanged; neighbourhood data is left untouched.
create or replace function public.save_property(payload jsonb, target_id uuid default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can manage properties' using errcode = '42501';
  end if;

  if target_id is null then
    insert into public.properties (
      slug, name, tagline, description, city, locality, address, latitude, longitude, price,
      type, bedrooms, bathrooms, area_sqft, year_built, parking, status, featured, agent_id
    ) values (
      payload ->> 'slug', payload ->> 'name', coalesce(payload ->> 'tagline', ''),
      coalesce(payload ->> 'description', ''), payload ->> 'city', payload ->> 'locality',
      coalesce(payload ->> 'address', ''), (payload ->> 'latitude')::double precision,
      (payload ->> 'longitude')::double precision, (payload ->> 'price')::bigint,
      (payload ->> 'type')::public.property_type, (payload ->> 'bedrooms')::smallint,
      (payload ->> 'bathrooms')::smallint, (payload ->> 'areaSqft')::integer,
      (payload ->> 'yearBuilt')::smallint, coalesce((payload ->> 'parking')::smallint, 0),
      (payload ->> 'status')::public.property_status, coalesce((payload ->> 'featured')::boolean, false),
      nullif(payload ->> 'agentId', '')::uuid
    )
    returning id into v_id;
  else
    update public.properties set
      slug        = payload ->> 'slug',
      name        = payload ->> 'name',
      tagline     = coalesce(payload ->> 'tagline', ''),
      description = coalesce(payload ->> 'description', ''),
      city        = payload ->> 'city',
      locality    = payload ->> 'locality',
      address     = coalesce(payload ->> 'address', ''),
      latitude    = (payload ->> 'latitude')::double precision,
      longitude   = (payload ->> 'longitude')::double precision,
      price       = (payload ->> 'price')::bigint,
      type        = (payload ->> 'type')::public.property_type,
      bedrooms    = (payload ->> 'bedrooms')::smallint,
      bathrooms   = (payload ->> 'bathrooms')::smallint,
      area_sqft   = (payload ->> 'areaSqft')::integer,
      year_built  = (payload ->> 'yearBuilt')::smallint,
      parking     = coalesce((payload ->> 'parking')::smallint, 0),
      status      = (payload ->> 'status')::public.property_status,
      featured    = coalesce((payload ->> 'featured')::boolean, false),
      agent_id    = nullif(payload ->> 'agentId', '')::uuid
    where id = target_id
    returning id into v_id;

    if v_id is null then
      raise exception 'Property not found' using errcode = 'P0002';
    end if;
  end if;

  with old as (
    delete from public.property_images where property_id = v_id
    returning url, kind, blur_data_url
  ),
  incoming as (
    select img ->> 'url' as url, coalesce(img ->> 'alt', '') as alt, 'photo'::text as kind,
           null::text as label, (ord - 1)::smallint as position
    from jsonb_array_elements(coalesce(payload -> 'images', '[]'::jsonb)) with ordinality as t(img, ord)
    union all
    select plan ->> 'url', left(concat_ws(' — ', payload ->> 'name', plan ->> 'label', 'floor plan'), 200),
           'floor_plan', plan ->> 'label', (ord - 1)::smallint
    from jsonb_array_elements(coalesce(payload -> 'floorPlans', '[]'::jsonb)) with ordinality as t(plan, ord)
  )
  insert into public.property_images (property_id, url, alt, kind, label, position, blur_data_url)
  select v_id, i.url, i.alt, i.kind, i.label, i.position,
         (select o.blur_data_url from old o where o.url = i.url and o.kind = i.kind limit 1)
  from incoming i;

  delete from public.property_amenities where property_id = v_id;
  insert into public.property_amenities (property_id, amenity_slug)
  select distinct v_id, a
  from jsonb_array_elements_text(coalesce(payload -> 'amenities', '[]'::jsonb)) as a;

  return v_id;
end;
$$;

revoke execute on function public.save_property(jsonb, uuid) from public, anon;
grant execute on function public.save_property(jsonb, uuid) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- Listing view used by search (cover image + aggregated amenities)
-- ════════════════════════════════════════════════════════════════════════════

create view public.property_listings
with (security_invoker = on)
as
select
  p.id,
  p.slug,
  p.name,
  p.tagline,
  p.city,
  p.locality,
  p.price,
  p.type,
  p.bedrooms,
  p.bathrooms,
  p.area_sqft,
  p.parking,
  p.status,
  p.featured,
  p.latitude,
  p.longitude,
  p.created_at,
  p.updated_at,
  (p.status = 'available') as is_available,
  coalesce(
    (select array_agg(pa.amenity_slug order by pa.amenity_slug)
       from public.property_amenities pa
      where pa.property_id = p.id),
    '{}'::text[]
  ) as amenity_slugs,
  lower(concat_ws(' ',
    p.name, p.tagline, p.locality, p.city, p.type::text,
    case p.city
      when 'ahmedabad' then 'gujarat'
      when 'mumbai'    then 'maharashtra'
      when 'pune'      then 'maharashtra'
      when 'bengaluru' then 'karnataka'
      when 'goa'       then 'goa'
      when 'delhi'     then 'new delhi'
    end,
    case p.type
      when 'house'      then 'modern house'
      when 'waterfront' then 'waterfront home'
      else ''
    end
  )) as search_text,
  cover.id            as cover_id,
  cover.url           as cover_url,
  cover.alt           as cover_alt,
  cover.blur_data_url as cover_blur
from public.properties p
left join lateral (
  select i.id, i.url, i.alt, i.blur_data_url
  from public.property_images i
  where i.property_id = p.id and i.kind = 'photo'
  order by i.position
  limit 1
) cover on true;

-- ════════════════════════════════════════════════════════════════════════════
-- Row-level security
-- ════════════════════════════════════════════════════════════════════════════

alter table public.profiles           enable row level security;
alter table public.agents             enable row level security;
alter table public.amenities          enable row level security;
alter table public.properties         enable row level security;
alter table public.property_images    enable row level security;
alter table public.property_amenities enable row level security;
alter table public.favorites          enable row level security;
alter table public.visit_requests     enable row level security;
alter table public.recently_viewed    enable row level security;
alter table public.inquiries          enable row level security;

-- Profiles: users read and edit their own row; admins read all.
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Only name and phone are client-writable; role changes go through set_user_role().
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Public catalogue: readable by everyone, writable by admins.
create policy "agents_read" on public.agents for select using (true);
create policy "agents_admin_write" on public.agents for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "amenities_read" on public.amenities for select using (true);
create policy "amenities_admin_write" on public.amenities for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "properties_read" on public.properties for select using (true);
create policy "properties_admin_insert" on public.properties for insert to authenticated
  with check ((select public.is_admin()));
create policy "properties_admin_update" on public.properties for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "properties_admin_delete" on public.properties for delete to authenticated
  using ((select public.is_admin()));

create policy "property_images_read" on public.property_images for select using (true);
create policy "property_images_admin_write" on public.property_images for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "property_amenities_read" on public.property_amenities for select using (true);
create policy "property_amenities_admin_write" on public.property_amenities for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Favourites: private to each user.
create policy "favorites_own" on public.favorites for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Visit requests: anyone may submit a pending request (guests with user_id null);
-- owners read theirs; admins read all and manage status; owners may cancel.
create policy "visits_insert" on public.visit_requests for insert to anon, authenticated
  with check (
    status = 'pending'
    and (user_id is null or user_id = (select auth.uid()))
  );

create policy "visits_select_own_or_admin" on public.visit_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "visits_admin_update" on public.visit_requests for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "visits_owner_cancel" on public.visit_requests for update to authenticated
  using (user_id = (select auth.uid()) and status in ('pending', 'confirmed'))
  with check (user_id = (select auth.uid()) and status = 'cancelled');

create policy "visits_admin_delete" on public.visit_requests for delete to authenticated
  using ((select public.is_admin()));

-- Status is the only column that can change after submission.
revoke update on public.visit_requests from anon, authenticated;
grant update (status) on public.visit_requests to authenticated;

-- Recently viewed: private to each user.
create policy "recently_viewed_own" on public.recently_viewed for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Inquiries: anyone may submit; only admins read.
create policy "inquiries_insert" on public.inquiries for insert to anon, authenticated with check (true);
create policy "inquiries_admin_read" on public.inquiries for select to authenticated
  using ((select public.is_admin()));

-- ════════════════════════════════════════════════════════════════════════════
-- Storage: public bucket for property photography (used when Cloudinary is
-- not configured). Reads are public; writes are admin-only.
-- ════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

create policy "property_images_bucket_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'property-images' and (select public.is_admin()));
create policy "property_images_bucket_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()));
create policy "property_images_bucket_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()));
