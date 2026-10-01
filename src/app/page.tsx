import type { Metadata } from "next";
import { CollectionsShowcase } from "@/components/home/collections-showcase";
import {
  CuratedResidences,
  EditorialStatement,
  ExploreByLocationHeader,
  FinalCta,
  Hero,
  NeighborhoodEditorial,
  SignatureResidence,
  WhyEstateX,
} from "@/components/home/home-sections";
import { LocationScroller } from "@/components/home/location-scroller";
import { RevealLines, Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { ArrowLink } from "@/components/ui/button";
import { blurFor } from "@/lib/blur";
import { CITIES, COLLECTIONS, SIGNATURE_PROPERTY_SLUG } from "@/lib/constants";
import { getStore } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const DEFAULT_FILTERS = { types: [], amenities: [], availableOnly: false, sort: "featured" as const };

export default async function HomePage() {
  const store = getStore();
  const [featured, signatureCandidate, cityStats, all] = await Promise.all([
    store.getFeaturedProperties(4, SIGNATURE_PROPERTY_SLUG),
    store.getPropertyBySlug(SIGNATURE_PROPERTY_SLUG),
    store.getCityStats(),
    store.searchAllProperties(DEFAULT_FILTERS),
  ]);

  // If the signature residence was removed, fall back to the most valuable remaining home.
  const fallback = !signatureCandidate && all.length ? [...all].sort((a, b) => b.price - a.price)[0] : null;
  const signature = signatureCandidate ?? (fallback ? await store.getPropertyBySlug(fallback.slug) : null);

  const tiles = CITIES.map((city) => ({
    slug: city.slug,
    name: city.name,
    tagline: city.tagline,
    count: cityStats.find((s) => s.city === city.slug)?.count ?? 0,
    image: { ...city.image, blurDataUrl: blurFor(city.image.url) },
  }));

  const showcase = COLLECTIONS.slice(0, 4).map((c) => ({
    slug: c.slug,
    name: c.name,
    kicker: c.kicker,
    description: c.description,
    count: all.filter((p) => p.type === c.type).length,
    image: { ...c.image, blurDataUrl: blurFor(c.image.url) },
  }));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "EstateX",
          url: absoluteUrl("/"),
          potentialAction: {
            "@type": "SearchAction",
            target: `${absoluteUrl("/properties")}?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <Hero />
      <CuratedResidences properties={featured} />
      <EditorialStatement />

      <section aria-labelledby="locations-heading" className="section-y">
        <ExploreByLocationHeader />
        <LocationScroller tiles={tiles} headingId="locations-heading" />
      </section>

      {signature ? <SignatureResidence property={signature} /> : null}

      <section aria-labelledby="collections-heading" className="section-y bg-surface">
        <div className="container-site">
          <div className="mb-16 grid gap-8 md:mb-24 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <p className="eyebrow text-muted" data-reveal="">
                Collections
              </p>
              <RevealLines id="collections-heading" lines={["Homes, by the way", "you want to live."]} className="mt-6 text-h2" />
            </div>
            <Reveal className="md:col-span-4 md:col-start-9 md:pb-2" delay={150}>
              <ArrowLink href="/collections">All collections</ArrowLink>
            </Reveal>
          </div>
          <CollectionsShowcase items={showcase} />
        </div>
      </section>

      <NeighborhoodEditorial />
      <WhyEstateX />
      <FinalCta />
    </>
  );
}
