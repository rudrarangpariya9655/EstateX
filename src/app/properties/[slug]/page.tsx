import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { RevealLines } from "@/components/motion/reveal";
import { CompareToggle } from "@/components/property/compare-toggle";
import { MobileActionBar, RecordView, ShareButton } from "@/components/property/detail-client";
import { EmiTeaser } from "@/components/property/emi-calculator";
import { FavoriteButton } from "@/components/property/favorite-button";
import { FloorPlans } from "@/components/property/floor-plans";
import { Neighborhood } from "@/components/property/neighborhood";
import { PropertyCard } from "@/components/property/property-card";
import { AgentProfile, Amenities, SectionHeading, Specifications } from "@/components/property/property-details";
import { PropertyGallery } from "@/components/property/property-gallery";
import { StatusLabel } from "@/components/property/status-label";
import { VisitRequestForm } from "@/components/property/visit-request-form";
import { JsonLd } from "@/components/seo/json-ld";
import { ArrowLink } from "@/components/ui/button";
import { CITY_BY_SLUG, DEMO_NOTICE, PROPERTY_TYPE_LABELS, STATUS_LABELS, cityName } from "@/lib/constants";
import { getStore } from "@/lib/data";
import { formatPrice, formatRupees, formatSpecs } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getStore().listPropertySlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/properties/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const property = await getStore().getPropertyBySlug(slug);
  if (!property) return { title: "Residence not found", robots: { index: false } };
  const city = cityName(property.city);
  return pageMetadata({
    title: `${property.name} — ${property.locality}, ${city}`,
    description: `${property.tagline}. ${PROPERTY_TYPE_LABELS[property.type]} in ${property.locality}, ${city} · ${formatPrice(property.price)} · ${formatSpecs(property)}.`,
    path: `/properties/${property.slug}`,
    image: property.cover?.url,
    imageAlt: property.cover?.alt,
  });
}

export default async function PropertyPage(props: PageProps<"/properties/[slug]">) {
  const { slug } = await props.params;
  const store = getStore();
  const property = await store.getPropertyBySlug(slug);
  if (!property) notFound();
  const similar = await store.getSimilarProperties(property, 3);
  const city = CITY_BY_SLUG[property.city];
  const paragraphs = property.description.split(/\n{2,}/).filter(Boolean);
  const sold = property.status === "sold";

  return (
    <article>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Properties", path: "/properties" },
          { name: city.name, path: `/properties?city=${city.slug}` },
          { name: property.name, path: `/properties/${property.slug}` },
        ])}
      />
      <RecordView propertyId={property.id} />

      {/* ── Title ─────────────────────────────────────────────────────── */}
      <header className="container-site pb-12 pt-8 md:pb-16 md:pt-12">
        <nav aria-label="Breadcrumb" className="hero-fade">
          <ol className="flex flex-wrap items-center gap-1.5 text-[0.8125rem] text-muted">
            <li>
              <Link href="/properties" className="hit-area hover:text-ink">
                Properties
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" strokeWidth={1.5} />
            </li>
            <li>
              <Link href={`/properties?city=${city.slug}`} className="hit-area hover:text-ink">
                {city.name}
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" strokeWidth={1.5} />
            </li>
            <li aria-current="page" className="text-ink">
              {property.name}
            </li>
          </ol>
        </nav>

        <div className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="hero-fade eyebrow text-muted" style={{ animationDelay: "60ms" }}>
              {PROPERTY_TYPE_LABELS[property.type]} · {property.locality}, {city.name}
            </p>
            <h1 className="hero-fade mt-5 text-h1" style={{ animationDelay: "120ms" }}>
              {property.name}
            </h1>
            <p className="hero-fade mt-6 max-w-2xl text-lead text-muted" style={{ animationDelay: "180ms" }}>
              {property.tagline}
            </p>
          </div>
          <div className="hero-fade flex flex-col gap-6 lg:col-span-4 lg:items-end lg:text-right" style={{ animationDelay: "240ms" }}>
            <div>
              <StatusLabel status={property.status} />
              <p className="mt-3 font-serif text-[2.5rem] leading-none md:text-[3rem]">{formatPrice(property.price)}</p>
              <p className="mt-2 text-[0.8125rem] tabular-nums text-muted">{formatRupees(property.price)}</p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <FavoriteButton propertyId={property.id} name={property.name} variant="inline" />
              <CompareToggle
                variant="inline"
                property={{ id: property.id, slug: property.slug, name: property.name, coverUrl: property.cover?.url ?? null }}
              />
              <ShareButton title={property.name} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Gallery ───────────────────────────────────────────────────── */}
      <section aria-label="Photographs" className="md:container-site">
        <PropertyGallery images={property.images} name={property.name} />
      </section>

      {/* ── Overview ──────────────────────────────────────────────────── */}
      <section aria-labelledby="overview-heading" className="container-site section-y">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <p className="eyebrow text-muted" data-reveal="">
              Overview
            </p>
            <h2 id="overview-heading" className="sr-only">
              Overview
            </h2>
            <div className="mt-8 flex flex-col gap-6">
              {paragraphs.map((para, i) => (
                <p
                  key={i}
                  data-reveal=""
                  style={{ ["--reveal-delay" as string]: i * 80 }}
                  className={i === 0 ? "font-serif text-[1.65rem] leading-[1.3] md:text-[2rem]" : "max-w-2xl text-[1.0625rem] leading-[1.75] text-ink-soft"}
                >
                  {para}
                </p>
              ))}
            </div>
          </div>

          <aside aria-label="Key facts" className="lg:col-span-4 lg:col-start-9">
            <div className="lg:sticky lg:top-28">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <dt className="eyebrow text-muted">Price</dt>
                  <dd className="mt-2 text-[1.0625rem] font-medium">{formatPrice(property.price)}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-muted">Status</dt>
                  <dd className="mt-2 text-[1.0625rem]">{STATUS_LABELS[property.status]}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="eyebrow text-muted">Residence</dt>
                  <dd className="mt-2 text-[0.9375rem]">{formatSpecs(property)}</dd>
                </div>
              </dl>
              <div className="mt-8">
                <EmiTeaser price={property.price} />
              </div>
              {sold ? (
                <p className="mt-8 text-[0.9375rem] leading-relaxed text-muted">
                  This residence has been sold. Explore{" "}
                  <Link href={`/properties?city=${city.slug}`} className="underline underline-offset-4">
                    other homes in {city.name}
                  </Link>
                  .
                </p>
              ) : (
                <a
                  href="#visit"
                  className="arrow-nudge mt-8 inline-flex h-12 w-full items-center justify-center gap-3 bg-ink label-caps text-ivory transition-colors duration-300 hover:bg-accent"
                >
                  Request a private visit
                </a>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* ── Specifications ────────────────────────────────────────────── */}
      <section aria-labelledby="specs-heading" className="container-site pb-[clamp(4rem,2.5rem+7.5vw,11rem)]">
        <SectionHeading eyebrow="Specifications" title="The essentials" id="specs-heading" className="mb-12 md:mb-16" />
        <Specifications property={property} />
      </section>

      {/* ── Amenities ─────────────────────────────────────────────────── */}
      <section aria-labelledby="amenities-heading" className="bg-surface section-y">
        <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-10">
          <SectionHeading eyebrow="Amenities" title="Inside and around" id="amenities-heading" className="lg:col-span-4" />
          <div className="lg:col-span-8">
            <Amenities amenities={property.amenities} />
          </div>
        </div>
      </section>

      {/* ── Floor plan ────────────────────────────────────────────────── */}
      {property.floorPlans.length ? (
        <section aria-labelledby="plan-heading" className="container-site section-y">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4">
              <SectionHeading eyebrow="Floor plan" title="How it fits together" id="plan-heading" />
              <p className="mt-8 max-w-sm text-[0.9375rem] leading-relaxed text-muted" data-reveal="">
                {formatSpecs(property)} across {property.floorPlans.length === 1 ? "a single level" : `${property.floorPlans.length} levels`}.
                Select a plan to enlarge it.
              </p>
            </div>
            <div className="lg:col-span-8">
              <FloorPlans plans={property.floorPlans} name={property.name} />
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Neighborhood ──────────────────────────────────────────────── */}
      <section aria-labelledby="area-heading" className="container-site section-y border-t border-line">
        <div className="mb-12 grid gap-8 md:mb-16 lg:grid-cols-12 lg:items-end lg:gap-10">
          <SectionHeading eyebrow="Neighborhood" title={`Living in ${property.locality}`} id="area-heading" className="lg:col-span-7" />
          <div className="lg:col-span-4 lg:col-start-9" data-reveal="">
            <p className="text-[0.9375rem] leading-relaxed text-muted">{city.intro}</p>
            <ArrowLink href={`/neighborhoods/${city.slug}`} className="mt-6">
              The {city.name} guide
            </ArrowLink>
          </div>
        </div>
        <Neighborhood property={property} cityLabel={city.name} />
      </section>

      {/* ── Advisor + visit ───────────────────────────────────────────── */}
      <section id="visit" aria-labelledby="visit-heading" className="scroll-mt-24 bg-surface section-y">
        <div className="container-site grid gap-16 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <p className="eyebrow text-muted" data-reveal="">
              Schedule a visit
            </p>
            <RevealLines id="visit-heading" lines={["See it", "in person."]} className="mt-5 text-h2" />
            <p className="mt-8 max-w-sm text-[0.9375rem] leading-relaxed text-muted" data-reveal="">
              Tell us when suits you. Your advisor will confirm a time, share the exact address and meet you there.
            </p>
            {property.agent ? (
              <div className="mt-14 border-t border-line pt-10" data-reveal="">
                <p className="eyebrow mb-6 text-muted">Your advisor</p>
                <AgentProfile agent={property.agent} />
              </div>
            ) : null}
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            {sold ? (
              <div className="border-t border-line pt-10">
                <p className="font-serif text-[2rem] leading-tight">This residence has been sold.</p>
                <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-muted">
                  Visits are no longer available. We&apos;d be glad to suggest similar homes in {city.name}.
                </p>
                <ArrowLink href="/contact" className="mt-8">
                  Speak with an advisor
                </ArrowLink>
              </div>
            ) : (
              <VisitRequestForm propertyId={property.id} propertyName={property.name} />
            )}
          </div>
        </div>
      </section>

      {/* ── Similar ───────────────────────────────────────────────────── */}
      {similar.length ? (
        <section aria-labelledby="similar-heading" className="container-site section-y">
          <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
            <SectionHeading eyebrow="You may also like" title="Similar residences" id="similar-heading" />
            <ArrowLink href={`/properties?city=${city.slug}`} className="self-start md:self-auto">
              More in {city.name}
            </ArrowLink>
          </div>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-20 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-10">
            {similar.map((p, i) => (
              <li key={p.id} data-reveal="" style={{ ["--reveal-delay" as string]: i * 90 }}>
                <PropertyCard property={p} />
              </li>
            ))}
          </ul>
          <p className="mt-24 max-w-2xl text-[0.75rem] leading-relaxed text-muted">{DEMO_NOTICE}</p>
        </section>
      ) : null}

      <MobileActionBar propertyId={property.id} name={property.name} price={property.price} disabled={sold} />
    </article>
  );
}
