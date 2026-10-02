import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Photo } from "@/components/ui/photo";
import { blurFor } from "@/lib/blur";
import { COLLECTIONS } from "@/lib/constants";
import { getStore } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/cn";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Collections",
  description: "Modern villas, urban penthouses, waterfront homes, country retreats and city apartments — EstateX residences, grouped by the way you want to live.",
  path: "/collections",
  image: COLLECTIONS[0]!.image.url,
});

const LAYOUT = [
  { wrap: "md:col-span-12", aspect: "aspect-[4/3] md:aspect-[21/9]", sizes: "100vw" },
  { wrap: "md:col-span-7", aspect: "aspect-[4/3]", sizes: "(min-width: 768px) 58vw, 100vw" },
  { wrap: "md:col-span-5 md:mt-32", aspect: "aspect-[4/5]", sizes: "(min-width: 768px) 42vw, 100vw" },
  { wrap: "md:col-span-5", aspect: "aspect-[4/5]", sizes: "(min-width: 768px) 42vw, 100vw" },
  { wrap: "md:col-span-7 md:mt-32", aspect: "aspect-[4/3]", sizes: "(min-width: 768px) 58vw, 100vw" },
];

export default async function CollectionsPage() {
  const all = await getStore().searchAllProperties({ types: [], amenities: [], availableOnly: false, sort: "featured" });

  return (
    <div className="pb-32 md:pb-44">
      <header className="container-site grid gap-10 pb-16 pt-14 md:pb-24 md:pt-20 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="hero-fade eyebrow text-muted">Explore</p>
          <h1 className="hero-fade mt-6 text-h1" style={{ animationDelay: "80ms" }}>
            Collections
          </h1>
        </div>
        <p className="hero-fade max-w-md text-lead text-muted lg:col-span-4 lg:col-start-9 lg:pb-3" style={{ animationDelay: "160ms" }}>
          Homes, grouped by the way you want to live — not by the number of bedrooms.
        </p>
      </header>

      <ul className="container-site grid gap-x-10 gap-y-20 md:grid-cols-12 md:gap-y-28">
        {COLLECTIONS.map((c, i) => {
          const count = all.filter((p) => p.type === c.type).length;
          const layout = LAYOUT[i % LAYOUT.length]!;
          return (
            <li key={c.slug} className={layout.wrap}>
              <Link href={`/collections/${c.slug}`} className="group block">
                <Reveal variant="image" className={cn("relative overflow-hidden bg-sand", layout.aspect)}>
                  <div className="reveal-scale absolute inset-0">
                    <Photo
                      src={c.image.url}
                      alt={c.image.alt}
                      blurDataUrl={blurFor(c.image.url)}
                      fill
                      preload={i === 0}
                      sizes={layout.sizes}
                      className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.03]"
                    />
                  </div>
                </Reveal>
                <div className="mt-7 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline" data-reveal="">
                  <div>
                    <p className="eyebrow text-muted">{c.kicker}</p>
                    <h2 className="mt-3 text-h3 transition-transform duration-500 ease-out-expo group-hover:translate-x-1">{c.name}</h2>
                  </div>
                  <p className="text-[0.875rem] text-muted">{count === 1 ? "1 residence" : `${count} residences`}</p>
                </div>
                <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-muted" data-reveal="">
                  {c.description}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
