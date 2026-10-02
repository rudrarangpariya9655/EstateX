import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { HeroLines, Reveal, RevealLines } from "@/components/motion/reveal";
import { Parallax } from "@/components/motion/parallax";
import { ArrowLink, ButtonLink } from "@/components/ui/button";
import { Photo } from "@/components/ui/photo";
import { blurFor } from "@/lib/blur";
import { DEMO_NOTICE } from "@/lib/constants";
import { unsplash } from "@/lib/images";
import { pageMetadata } from "@/lib/seo";

const HERO = {
  url: unsplash("1613490493576-7fde63acd811"),
  alt: "A white villa with a deep timber soffit reflected in a long, still pool",
};
const WIDE = {
  url: unsplash("1600566753190-17f0baa2a6c3"),
  alt: "An entrance court with vertical timber cladding and black steel gates",
};
const TALL = {
  url: unsplash("1600573472550-8090b5e0745e"),
  alt: "A floating timber staircase beside full-height glazing",
};

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "EstateX lists fewer homes than a marketplace, on purpose. How we choose residences — and the principles behind the platform.",
  path: "/about",
  image: HERO.url,
  imageAlt: HERO.alt,
});

const PROCESS = [
  {
    title: "Look",
    body: "We start with the architecture: plan, proportion, light and materials. A home has to be well made before anything else.",
  },
  {
    title: "Visit",
    body: "An advisor spends time in every residence — at different hours where we can — and walks the street around it.",
  },
  {
    title: "Verify",
    body: "Ownership, approvals and specifications are checked before a listing is written. Anything we can't confirm, we don't claim.",
  },
  {
    title: "Present",
    body: "Honest photography, real floor plans and plain-language writing — so you can understand a home before you see it.",
  },
];

const WILL = [
  "Show the price, always",
  "Label every estimate as an estimate",
  "Tell you when a home isn't right for you",
  "Use your details only to answer you",
];

const WONT = [
  "List a home we haven't visited",
  "Pad the catalogue to look bigger",
  "Call a visit confirmed before it is",
  "Sell your information to anyone",
];

export default function AboutPage() {
  return (
    <>
      <section aria-labelledby="about-heading" className="on-dark relative isolate h-[88svh] min-h-[36rem] overflow-hidden bg-ink text-white">
        <Parallax speed={0.15}>
          <div className="hero-settle absolute inset-0">
            <Photo
              src={HERO.url}
              alt={HERO.alt}
              blurDataUrl={blurFor(HERO.url)}
              fill
              preload
              fetchPriority="high"
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </Parallax>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-ink/30" />
        <div className="container-site relative flex h-full flex-col justify-end pb-14 md:pb-20">
          <p className="hero-fade eyebrow text-white/75" style={{ "--delay": 100 } as CSSProperties}>
            About EstateX
          </p>
          <HeroLines
            id="about-heading"
            lines={["We look for homes", <em key="a">with a point of view.</em>]}
            className="mt-6 max-w-5xl text-h1"
            startIndex={1}
          />
        </div>
      </section>

      <section aria-label="Our story" className="section-y">
        <div className="container-site grid gap-10 md:grid-cols-12">
          <p className="eyebrow text-muted md:col-span-3" data-reveal="">
            Why we exist
          </p>
          <div className="md:col-span-8">
            <RevealLines
              as="p"
              lines={[
                "Most property sites are built to show",
                "you everything. We would rather",
                <>
                  show you <em className="text-accent">the right thing.</em>
                </>,
              ]}
              className="text-statement"
            />
            <Reveal className="mt-14 grid max-w-3xl gap-8 text-[1.0625rem] leading-[1.75] text-ink-soft md:grid-cols-2" delay={150}>
              <p>
                EstateX began with a simple frustration: searching for a home had become an exercise in filtering noise.
                Hundreds of near-identical listings, the same rooms photographed the same way, prices hidden behind a
                phone call.
              </p>
              <p>
                So we built the opposite — a small, carefully chosen collection of residences across six Indian cities,
                each one presented with the honesty and attention we would want ourselves.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section aria-label="Architecture" className="pb-[clamp(4rem,2.5rem+7.5vw,11rem)]">
        <div className="container-site grid gap-12 md:grid-cols-12 md:gap-10">
          <figure className="md:col-span-7">
            <Reveal variant="image" className="relative aspect-[4/3] overflow-hidden bg-sand">
              <div className="reveal-scale absolute inset-0">
                <Photo src={WIDE.url} alt={WIDE.alt} blurDataUrl={blurFor(WIDE.url)} fill sizes="(min-width: 768px) 56vw, 100vw" className="object-cover" />
              </div>
            </Reveal>
            <figcaption className="mt-4 text-[0.8125rem] text-muted" data-reveal="">
              Material first — timber, steel and shade at the threshold of a house.
            </figcaption>
          </figure>
          <figure className="md:col-span-4 md:col-start-9 md:mt-40">
            <Reveal variant="image" delay={200} className="relative aspect-[3/4] overflow-hidden bg-sand">
              <div className="reveal-scale absolute inset-0">
                <Photo src={TALL.url} alt={TALL.alt} blurDataUrl={blurFor(TALL.url)} fill sizes="(min-width: 768px) 31vw, 100vw" className="object-cover" />
              </div>
            </Reveal>
            <figcaption className="mt-4 text-[0.8125rem] text-muted" data-reveal="">
              Light, movement and the view out.
            </figcaption>
          </figure>
        </div>
      </section>

      <section aria-labelledby="process-heading" className="section-y bg-surface">
        <div className="container-site">
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <p className="eyebrow text-muted" data-reveal="">
                How we curate
              </p>
              <RevealLines id="process-heading" lines={["Four steps,", "every home."]} className="mt-6 text-h2" />
            </div>
            <Reveal className="md:col-span-4 md:col-start-9 md:pb-2" delay={150}>
              <p className="max-w-sm text-[0.9375rem] leading-relaxed text-muted">
                Nothing appears on EstateX by default. This is what every residence goes through before it does.
              </p>
            </Reveal>
          </div>
          <ol className="mt-16 grid gap-x-10 md:mt-24 md:grid-cols-2 xl:grid-cols-4">
            {PROCESS.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 90} className="border-t border-ink/80 pb-12 pt-8 xl:pb-0">
                <span className="font-serif text-[3.5rem] leading-none text-ink/25">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-8 text-h4">{step.title}</h3>
                <p className="mt-4 max-w-xs text-[0.9375rem] leading-relaxed text-muted">{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="principles-heading" className="section-y">
        <div className="container-site grid gap-16 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <p className="eyebrow text-muted" data-reveal="">
              Platform principles
            </p>
            <RevealLines id="principles-heading" lines={["Simple promises,", <em key="k">kept.</em>]} className="mt-6 text-h2" />
          </div>
          <div className="grid gap-14 sm:grid-cols-2 sm:gap-10 lg:col-span-7 lg:col-start-6">
            {[
              { title: "We will", items: WILL },
              { title: "We won’t", items: WONT },
            ].map((list, li) => (
              <Reveal key={list.title} delay={li * 120}>
                <h3 className="label-caps text-muted">{list.title}</h3>
                <ul className="mt-6">
                  {list.items.map((item) => (
                    <li key={item} className="border-t border-line py-5 font-serif text-[1.5rem] leading-snug last:border-b">
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="about-cta" className="border-t border-line section-y">
        <div className="container-site grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <RevealLines id="about-cta" lines={["Start with a home", "that feels right."]} className="text-h2" />
          </div>
          <Reveal className="flex flex-col items-start gap-8 lg:col-span-4 lg:col-start-9" delay={150}>
            <ButtonLink href="/properties" arrow>
              Explore properties
            </ButtonLink>
            <ArrowLink href="/contact">Speak with an advisor</ArrowLink>
          </Reveal>
        </div>
        <p className="container-site mt-24 max-w-3xl text-[0.75rem] leading-relaxed text-muted">{DEMO_NOTICE}</p>
      </section>
    </>
  );
}
