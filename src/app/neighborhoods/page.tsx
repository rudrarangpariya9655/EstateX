import type { Metadata } from "next";
import Link from "next/link";
import { Reveal, RevealLines } from "@/components/motion/reveal";
import { ArrowLink } from "@/components/ui/button";
import { Photo } from "@/components/ui/photo";
import { blurFor } from "@/lib/blur";
import { CITIES, DEMO_NOTICE } from "@/lib/constants";
import { getStore } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/cn";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Neighborhoods",
  description:
    "City guides to Ahmedabad, Mumbai, Bengaluru, Goa, Pune and Delhi — the architecture, streets and rhythms behind each EstateX address.",
  path: "/neighborhoods",
  image: CITIES[1]!.image.url,
});

export default async function NeighborhoodsPage() {
  const stats = await getStore().getCityStats();

  return (
    <>
      <header className="container-site grid gap-10 pb-[clamp(4rem,2.5rem+7.5vw,11rem)] pt-14 md:pt-20 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="hero-fade eyebrow text-muted">City guides</p>
          <h1 className="hero-fade mt-6 text-h1" style={{ animationDelay: "80ms" }}>
            Neighborhoods
          </h1>
        </div>
        <p className="hero-fade max-w-md text-lead text-muted lg:col-span-4 lg:col-start-9 lg:pb-3" style={{ animationDelay: "160ms" }}>
          The streets, light and rhythms behind each address — the things a listing can&apos;t tell you.
        </p>
      </header>

      <ol className="flex flex-col gap-[clamp(5rem,3rem+8vw,12rem)] pb-[clamp(5rem,3rem+8vw,12rem)]">
        {CITIES.map((city, i) => {
          const stat = stats.find((s) => s.city === city.slug);
          const flip = i % 2 === 1;
          return (
            <li key={city.slug} className="container-site">
              <article aria-labelledby={`city-${city.slug}`} className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-10">
                <Link
                  href={`/neighborhoods/${city.slug}`}
                  tabIndex={-1}
                  aria-hidden
                  className={cn("group block lg:col-span-7", flip && "lg:order-2 lg:col-start-6")}
                >
                  <Reveal variant="image" className="relative aspect-[4/3] overflow-hidden bg-sand lg:aspect-[5/4]">
                    <div className="reveal-scale absolute inset-0">
                      <Photo
                        src={city.image.url}
                        alt={city.image.alt}
                        blurDataUrl={blurFor(city.image.url)}
                        fill
                        sizes="(min-width: 1024px) 56vw, 100vw"
                        className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.03]"
                      />
                    </div>
                  </Reveal>
                </Link>
                <div className={cn("lg:col-span-4", flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-9")}>
                  <p className="eyebrow text-muted" data-reveal="">
                    {String(i + 1).padStart(2, "0")} · {city.state}
                  </p>
                  <RevealLines as="h2" id={`city-${city.slug}`} lines={[city.name]} className="mt-5 text-h2" />
                  <Reveal delay={120}>
                    <p className="mt-3 font-serif text-[1.35rem] italic text-muted">{city.tagline}</p>
                    <p className="mt-8 max-w-md text-[0.9375rem] leading-relaxed text-ink-soft">{city.intro}</p>
                    <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-line pt-6">
                      <div>
                        <dt className="eyebrow text-muted">Residences</dt>
                        <dd className="mt-2 text-[1.0625rem]">{stat?.count ?? 0}</dd>
                      </div>
                      <div>
                        <dt className="eyebrow text-muted">Demo range</dt>
                        <dd className="mt-2 text-[1.0625rem]">
                          {stat?.minPrice != null && stat.maxPrice != null
                            ? stat.minPrice === stat.maxPrice
                              ? formatPrice(stat.minPrice)
                              : `${formatPrice(stat.minPrice)} – ${formatPrice(stat.maxPrice)}`
                            : "—"}
                        </dd>
                      </div>
                    </dl>
                    <ArrowLink href={`/neighborhoods/${city.slug}`} className="mt-10">
                      The {city.name} guide
                    </ArrowLink>
                  </Reveal>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
      <p className="container-site max-w-3xl pb-32 text-[0.75rem] leading-relaxed text-muted">{DEMO_NOTICE}</p>
    </>
  );
}
