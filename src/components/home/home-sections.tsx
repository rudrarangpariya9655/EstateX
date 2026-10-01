import type { CSSProperties } from "react";
import { ArrowLink, ButtonLink } from "@/components/ui/button";
import { Photo } from "@/components/ui/photo";
import { HeroLines, Reveal, RevealLines } from "@/components/motion/reveal";
import { Parallax } from "@/components/motion/parallax";
import { PropertyCard } from "@/components/property/property-card";
import { cityName } from "@/lib/constants";
import { formatPrice, formatSpecs } from "@/lib/format";
import { unsplash } from "@/lib/images";
import { blurFor } from "@/lib/blur";
import type { Property, PropertySummary } from "@/lib/types";
import { HeroSearch } from "./hero-search";

const HERO_IMAGE = {
  url: unsplash("1600585154340-be6161a56a0c"),
  alt: "A timber-clad modern house glowing at dusk beneath a tall eucalyptus tree",
};

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="on-dark relative isolate h-[100svh] min-h-[40rem] overflow-hidden bg-ink text-white">
      <Parallax speed={0.18}>
        <div className="hero-settle absolute inset-0">
          <Photo
            src={HERO_IMAGE.url}
            alt={HERO_IMAGE.alt}
            blurDataUrl={blurFor(HERO_IMAGE.url)}
            fill
            preload
            fetchPriority="high"
            quality={75}
            sizes="100vw"
            className="object-cover object-[60%_center]"
          />
        </div>
      </Parallax>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/10" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-ink/50 to-transparent" />

      <div className="container-site relative flex h-full flex-col justify-end pb-8 md:pb-12">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="hero-fade eyebrow text-white/75" style={{ "--delay": 100 } as CSSProperties}>
              Distinctive homes across India
            </p>
            <HeroLines
              lines={["Find a place", "that feels", <em key="em">like yours.</em>]}
              className="mt-6 text-display"
              startIndex={1}
              id="hero-heading"
            />
          </div>
          <div className="flex flex-col gap-8 lg:col-span-4 lg:pb-3">
            <p
              className="hero-fade max-w-md text-[1.0625rem] leading-relaxed text-white/85"
              style={{ "--delay": 550 } as CSSProperties}
            >
              Discover distinctive homes, thoughtfully selected for architecture, location and lifestyle.
            </p>
            <div className="hero-fade flex flex-wrap gap-3" style={{ "--delay": 700 } as CSSProperties}>
              <ButtonLink href="/properties" variant="light" arrow>
                Explore properties
              </ButtonLink>
              <ButtonLink href="/collections" variant="outline-light">
                View collections
              </ButtonLink>
            </div>
          </div>
        </div>
        <div className="hero-fade mt-12 md:mt-16" style={{ "--delay": 900 } as CSSProperties}>
          <HeroSearch />
        </div>
      </div>
    </section>
  );
}

export function CuratedResidences({ properties }: { properties: PropertySummary[] }) {
  if (!properties.length) return null;
  const layout = [
    { wrap: "lg:col-span-7", aspect: "aspect-[4/3]", sizes: "(min-width: 1024px) 56vw, (min-width: 768px) 46vw, 100vw" },
    { wrap: "lg:col-span-4 lg:col-start-9 lg:mt-48", aspect: "aspect-[4/5]", sizes: "(min-width: 1024px) 31vw, (min-width: 768px) 46vw, 100vw" },
    { wrap: "lg:col-span-4 lg:col-start-1 lg:-mt-24", aspect: "aspect-[4/5]", sizes: "(min-width: 1024px) 31vw, (min-width: 768px) 46vw, 100vw" },
    { wrap: "lg:col-span-6 lg:col-start-7 lg:mt-24", aspect: "aspect-[4/3]", sizes: "(min-width: 1024px) 48vw, (min-width: 768px) 46vw, 100vw" },
  ];
  return (
    <section aria-labelledby="curated-heading" className="section-y">
      <div className="container-site">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="eyebrow text-muted" data-reveal="">
              Selected this season
            </p>
            <RevealLines id="curated-heading" lines={["Curated", "residences."]} className="mt-6 text-h1" />
          </div>
          <Reveal className="flex flex-col items-start gap-8 md:col-span-4 md:col-start-9 md:pb-3" delay={150}>
            <p className="max-w-sm text-lead text-muted">A considered selection of exceptional homes.</p>
            <ArrowLink href="/properties">View all properties</ArrowLink>
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-x-10 gap-y-20 md:mt-24 md:grid-cols-2 lg:grid-cols-12 lg:gap-y-0">
          {properties.slice(0, 4).map((property, i) => (
            <Reveal key={property.id} className={layout[i]!.wrap} delay={i % 2 ? 120 : 0}>
              <PropertyCard property={property} aspect={layout[i]!.aspect} sizes={layout[i]!.sizes} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EditorialStatement() {
  return (
    <section aria-label="Our point of view" className="section-y">
      <div className="container-site grid gap-10 md:grid-cols-12">
        <p className="eyebrow text-muted md:col-span-3" data-reveal="">
          Our point of view
        </p>
        <div className="md:col-span-9">
          <RevealLines
            as="blockquote"
            lines={[
              "We believe finding a home",
              "should feel less like searching",
              <>
                and more like <em className="text-accent">discovering.</em>
              </>,
            ]}
            className="text-statement max-w-[22ch] md:max-w-none"
          />
          <Reveal className="mt-14 flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-14" delay={200}>
            <p className="max-w-md text-[0.9375rem] leading-relaxed text-muted">
              EstateX lists fewer homes than a marketplace, on purpose. Each one is chosen for how it is made, where it
              sits and how it feels to live in.
            </p>
            <ArrowLink href="/about" className="shrink-0">
              How we curate
            </ArrowLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function ExploreByLocationHeader() {
  return (
    <div className="container-site grid gap-8 md:grid-cols-12 md:items-end">
      <div className="md:col-span-7">
        <p className="eyebrow text-muted" data-reveal="">
          Six cities
        </p>
        <RevealLines id="locations-heading" lines={["Explore by", "location."]} className="mt-6 text-h1" />
      </div>
      <Reveal className="md:col-span-4 md:col-start-9 md:pb-24" delay={150}>
        <p className="max-w-sm text-lead text-muted">From riverside penthouses in Ahmedabad to monsoon retreats above Lonavala.</p>
      </Reveal>
    </div>
  );
}

export function SignatureResidence({ property }: { property: Property }) {
  const image = property.images[0];
  return (
    <section aria-labelledby="signature-heading" className="relative bg-ivory lg:min-h-[100svh] lg:bg-ink">
      <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[16/10] lg:absolute lg:inset-0 lg:aspect-auto">
        <Parallax speed={0.1}>
          <Photo
            src={image?.url}
            alt={image?.alt ?? property.name}
            blurDataUrl={image?.blurDataUrl}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </Parallax>
        <div aria-hidden className="absolute inset-0 hidden bg-gradient-to-r from-ink/35 via-transparent to-transparent lg:block" />
      </div>
      <div className="container-site relative lg:flex lg:min-h-[100svh] lg:items-end lg:py-20">
        <Reveal className="bg-ivory py-14 sm:px-12 sm:py-16 lg:max-w-[34rem] lg:px-14 lg:py-16">
          <p className="eyebrow text-accent">Signature residence</p>
          <h2 id="signature-heading" className="mt-6 text-h1">
            {property.name}
          </h2>
          <p className="mt-4 text-[0.9375rem] text-muted">
            {property.locality}, {cityName(property.city)}, India
          </p>
          <p className="mt-8 max-w-md text-[1.0625rem] leading-relaxed text-ink-soft">{property.tagline}.</p>
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-line pt-6">
            <div>
              <dt className="eyebrow text-muted">Price</dt>
              <dd className="mt-2 text-[1.125rem] font-medium">{formatPrice(property.price)}</dd>
            </div>
            <div>
              <dt className="eyebrow text-muted">Residence</dt>
              <dd className="mt-2 text-[0.9375rem] leading-snug">{formatSpecs(property)}</dd>
            </div>
          </dl>
          <ArrowLink href={`/properties/${property.slug}`} className="mt-10">
            Discover the residence
          </ArrowLink>
        </Reveal>
      </div>
    </section>
  );
}

export function NeighborhoodEditorial() {
  const main = {
    url: unsplash("1566552881560-0be862a7c445"),
    alt: "Gothic Revival stone buildings in South Mumbai glistening after monsoon rain",
  };
  const detail = {
    url: unsplash("1529253355930-ddbe423a2ac7"),
    alt: "The Gateway of India reflected in a rain-filled plaza",
  };
  return (
    <section aria-labelledby="editorial-heading" className="section-y">
      <div className="container-site grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="relative lg:col-span-7">
          <Reveal variant="image" className="relative aspect-[4/5] overflow-hidden bg-sand sm:aspect-[5/4] lg:aspect-[4/5]">
            <div className="reveal-scale absolute inset-0">
              <Photo src={main.url} alt={main.alt} blurDataUrl={blurFor(main.url)} fill sizes="(min-width: 1024px) 56vw, 100vw" className="object-cover" />
            </div>
          </Reveal>
          <Reveal
            variant="image"
            delay={250}
            className="absolute -bottom-12 right-0 hidden aspect-[4/5] w-[38%] overflow-hidden border-[10px] border-ivory bg-sand sm:block lg:-right-16 lg:w-[34%]"
          >
            <div className="reveal-scale absolute inset-0">
              <Photo src={detail.url} alt={detail.alt} blurDataUrl={blurFor(detail.url)} fill sizes="22vw" className="object-cover" />
            </div>
          </Reveal>
        </div>
        <div className="flex flex-col justify-center lg:col-span-4 lg:col-start-9">
          <p className="eyebrow text-muted" data-reveal="">
            Neighborhood notes
          </p>
          <RevealLines id="editorial-heading" lines={["Mumbai,", "after the rain."]} className="mt-6 text-h2" />
          <Reveal delay={150}>
            <p className="mt-8 text-lead text-muted">
              When the monsoon arrives, the city slows and its stone softens. The Gothic and Art Deco façades of the
              south glisten; the sea-facing neighborhoods of the west turn silver and green.
            </p>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">
              Our city guides look at the streets, light and rhythms behind each address — the things a listing can&apos;t
              tell you.
            </p>
            <ArrowLink href="/neighborhoods/mumbai" className="mt-10">
              Read the Mumbai guide
            </ArrowLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const PRINCIPLES = [
  {
    title: "Curated, not aggregated",
    body: "Every residence is reviewed for its architecture, light, setting and build quality before it appears here. We say no far more often than yes.",
  },
  {
    title: "Information you can trust",
    body: "Clear prices, real floor plans and plain-language descriptions. When something is an estimate — a payment, a distance — we label it as one.",
  },
  {
    title: "Advisors who know the street",
    body: "Each city has an advisor who knows its neighborhoods by name, and will tell you honestly when a home is not the right one.",
  },
  {
    title: "Your search stays yours",
    body: "Save homes, compare them and request visits without being added to a mailing list. Your details are used only to answer you.",
  },
];

export function WhyEstateX() {
  return (
    <section aria-labelledby="why-heading" className="section-y bg-surface">
      <div className="container-site grid gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <p className="eyebrow text-muted" data-reveal="">
              Why EstateX
            </p>
            <RevealLines id="why-heading" lines={["Fewer homes.", <em key="b">Better chosen.</em>]} className="mt-6 text-h2" />
          </div>
        </div>
        <ol className="lg:col-span-6 lg:col-start-7">
          {PRINCIPLES.map((item, i) => (
            <Reveal as="li" key={item.title} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-line py-10 last:border-b md:py-12" delay={i * 60}>
              <span className="pt-1.5 text-[0.8125rem] tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-h4">{item.title}</h3>
                <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function FinalCta() {
  const image = {
    url: unsplash("1582268611958-ebfd161ef9cf"),
    alt: "A glass pavilion and pool glowing softly in the evening",
  };
  return (
    <section aria-labelledby="cta-heading" className="on-dark relative isolate overflow-hidden bg-ink text-white">
      <Parallax speed={0.12}>
        <Photo src={image.url} alt="" blurDataUrl={blurFor(image.url)} fill sizes="100vw" className="object-cover opacity-70" />
      </Parallax>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/25" />
      <div className="container-site relative section-y">
        <div className="max-w-3xl py-10 md:py-20">
          <p className="eyebrow text-white/70" data-reveal="">
            Begin
          </p>
          <RevealLines id="cta-heading" lines={["Begin with a", "conversation."]} className="mt-6 text-h1" />
          <Reveal delay={200}>
            <p className="mt-8 max-w-md text-lead text-white/80">
              Tell us how you want to live. An advisor will come back with a short list — not a long one.
            </p>
            <div className="mt-12 flex flex-wrap gap-3">
              <ButtonLink href="/properties" variant="light" arrow>
                Explore properties
              </ButtonLink>
              <ButtonLink href="/contact" variant="outline-light">
                Speak with an advisor
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
