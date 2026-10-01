import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PropertyMap } from "@/components/map/property-map";
import { Reveal, RevealLines } from "@/components/motion/reveal";
import { PropertyCard } from "@/components/property/property-card";
import { JsonLd } from "@/components/seo/json-ld";
import { ArrowLink, ButtonLink } from "@/components/ui/button";
import { Photo } from "@/components/ui/photo";
import { blurFor } from "@/lib/blur";
import { CITIES, CITY_BY_SLUG } from "@/lib/constants";
import { getStore } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { searchHref } from "@/lib/search/filters";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { CITY_SLUGS, type CitySlug } from "@/lib/types";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return CITY_SLUGS.map((city) => ({ city }));
}

function cityFrom(slug: string) {
  return (CITY_SLUGS as readonly string[]).includes(slug) ? CITY_BY_SLUG[slug as CitySlug] : null;
}

export async function generateMetadata(props: PageProps<"/neighborhoods/[city]">): Promise<Metadata> {
  const city = cityFrom((await props.params).city);
  if (!city) return { title: "Neighborhood not found" };
  return pageMetadata({
    title: `${city.name} — city guide`,
    description: `${city.intro} Architecture, lifestyle and EstateX residences in ${city.name}.`,
    path: `/neighborhoods/${city.slug}`,
    image: city.image.url,
    imageAlt: city.image.alt,
  });
}

export default async function CityGuidePage(props: PageProps<"/neighborhoods/[city]">) {
  const city = cityFrom((await props.params).city);
  if (!city) notFound();
  const store = getStore();
  const [properties, stats] = await Promise.all([store.getPropertiesByCity(city.slug), store.getCityStats()]);
  const stat = stats.find((s) => s.city === city.slug);
  const featured = properties.slice(0, 3);
  const others = CITIES.filter((c) => c.slug !== city.slug);
  const next = CITIES[(CITIES.findIndex((c) => c.slug === city.slug) + 1) % CITIES.length]!;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Neighborhoods", path: "/neighborhoods" },
          { name: city.name, path: `/neighborhoods/${city.slug}` },
        ])}
      />
      <header className="container-site pb-12 pt-8 md:pb-16 md:pt-12">
        <nav aria-label="Breadcrumb" className="hero-fade">
          <ol className="flex flex-wrap items-center gap-1.5 text-[0.8125rem] text-muted">
            <li>
              <Link href="/neighborhoods" className="hit-area hover:text-ink">
                Neighborhoods
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" strokeWidth={1.5} />
            </li>
            <li aria-current="page" className="text-ink">
              {city.name}
            </li>
          </ol>
        </nav>
        <div className="mt-12 grid gap-8 md:mt-16 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="hero-fade eyebrow text-muted" style={{ animationDelay: "60ms" }}>
              {city.state}, India
            </p>
            <h1 className="hero-fade mt-5 text-display" style={{ animationDelay: "120ms" }}>
              {city.name}
            </h1>
          </div>
          <p className="hero-fade font-serif text-[1.6rem] italic leading-snug text-muted lg:col-span-4 lg:pb-4 lg:text-right" style={{ animationDelay: "200ms" }}>
            {city.tagline}
          </p>
        </div>
      </header>

      <div className="md:container-site">
        <div className="hero-fade relative aspect-[4/3] overflow-hidden bg-sand sm:aspect-[16/9] lg:aspect-[21/9]" style={{ animationDelay: "260ms" }}>
          <Photo src={city.image.url} alt={city.image.alt} blurDataUrl={blurFor(city.image.url)} fill preload sizes="100vw" className="object-cover" />
        </div>
      </div>

      <section aria-label="Overview" className="section-y">
        <div className="container-site grid gap-10 md:grid-cols-12">
          <p className="eyebrow text-muted md:col-span-3" data-reveal="">
            Overview
          </p>
          <div className="md:col-span-9">
            <Reveal as="p" className="max-w-4xl font-serif text-[clamp(1.75rem,1.2rem+2vw,3rem)] leading-[1.18]">
              {city.intro}
            </Reveal>
          </div>
        </div>
      </section>

      <section aria-label="Architecture and lifestyle" className="border-t border-line section-y">
        <div className="container-site grid gap-16 md:grid-cols-2 md:gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <h2 className="eyebrow text-muted">Architecture</h2>
            <p className="mt-8 text-[1.0625rem] leading-[1.8] text-ink-soft">{city.architecture}</p>
          </Reveal>
          <Reveal className="lg:col-span-5 lg:col-start-8" delay={120}>
            <h2 className="eyebrow text-muted">Lifestyle</h2>
            <p className="mt-8 text-[1.0625rem] leading-[1.8] text-ink-soft">{city.lifestyle}</p>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="localities-heading" className="bg-surface section-y">
        <div className="container-site grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <p className="eyebrow text-muted" data-reveal="">
              Where to look
            </p>
            <RevealLines id="localities-heading" lines={["Localities", "we know well."]} className="mt-6 text-h2" />
            <Reveal className="mt-12 border-t border-line pt-8" delay={150}>
              <dl className="grid grid-cols-2 gap-6">
                <div>
                  <dt className="eyebrow text-muted">Residences</dt>
                  <dd className="mt-2 font-serif text-[2.25rem] leading-none">{stat?.count ?? 0}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-muted">Demo price range</dt>
                  <dd className="mt-3 text-[1rem]">
                    {stat?.minPrice != null && stat.maxPrice != null ? `${formatPrice(stat.minPrice)} – ${formatPrice(stat.maxPrice)}` : "—"}
                  </dd>
                </div>
              </dl>
              <p className="mt-6 text-[0.75rem] leading-relaxed text-muted">
                Calculated from EstateX demo listings — illustrative seed data, not market information.
              </p>
            </Reveal>
          </div>
          <ol className="lg:col-span-7 lg:col-start-6">
            {city.localities.map((locality, i) => (
              <Reveal as="li" key={locality.name} delay={i * 80} className="grid gap-3 border-t border-line py-8 last:border-b sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8 md:py-10">
                <h3 className="text-h4">{locality.name}</h3>
                <p className="text-[0.9375rem] leading-relaxed text-muted sm:pt-1.5">{locality.note}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {featured.length ? (
        <section aria-labelledby="homes-heading" className="section-y">
          <div className="container-site">
            <div className="mb-14 flex flex-col gap-6 md:mb-20 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow text-muted" data-reveal="">
                  Residences
                </p>
                <RevealLines id="homes-heading" lines={[`Homes in ${city.name}`]} className="mt-6 text-h2" />
              </div>
              {properties.length > featured.length ? (
                <ArrowLink href={searchHref({ city: city.slug })} className="self-start md:self-auto">
                  All {properties.length} residences
                </ArrowLink>
              ) : null}
            </div>
            <ul className="grid grid-cols-1 gap-x-8 gap-y-20 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-10">
              {featured.map((p, i) => (
                <li key={p.id} data-reveal="" style={{ ["--reveal-delay" as string]: i * 90 }}>
                  <PropertyCard property={p} />
                </li>
              ))}
            </ul>
            <div className="mt-24 md:mt-32">
              <p className="eyebrow mb-8 text-muted" data-reveal="">
                On the map
              </p>
              <PropertyMap
                label={`Map of EstateX residences in ${city.name}`}
                className="aspect-[4/5] sm:aspect-[16/10] lg:aspect-[21/9]"
                points={properties.map((p) => ({
                  id: p.id,
                  slug: p.slug,
                  name: p.name,
                  locality: p.locality,
                  city: p.city,
                  price: p.price,
                  latitude: p.latitude,
                  longitude: p.longitude,
                  coverUrl: p.cover?.url ?? null,
                }))}
              />
            </div>
          </div>
        </section>
      ) : (
        <section className="container-site section-y">
          <p className="max-w-md text-lead text-muted">There are no EstateX residences in {city.name} at the moment.</p>
          <ButtonLink href="/properties" className="mt-10" arrow>
            Explore all properties
          </ButtonLink>
        </section>
      )}

      <section aria-label="Other cities" className="border-t border-line">
        <Link href={`/neighborhoods/${next.slug}`} className="group container-site flex flex-col gap-4 py-20 md:flex-row md:items-end md:justify-between md:py-28">
          <div>
            <p className="eyebrow text-muted">Next city</p>
            <p className="mt-5 text-h1 transition-transform duration-700 ease-out-expo group-hover:translate-x-2">{next.name}</p>
          </div>
          <p className="max-w-xs text-[0.9375rem] text-muted md:text-right">{next.tagline}</p>
        </Link>
        <nav aria-label="All city guides" className="container-site border-t border-line py-8">
          <ul className="flex flex-wrap gap-x-8 gap-y-2 text-[0.875rem] text-muted">
            {others.map((c) => (
              <li key={c.slug}>
                <Link href={`/neighborhoods/${c.slug}`} className="inline-flex min-h-11 items-center hover:text-ink">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </>
  );
}
