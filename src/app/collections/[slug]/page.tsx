import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PropertyCard } from "@/components/property/property-card";
import { JsonLd } from "@/components/seo/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Photo } from "@/components/ui/photo";
import { blurFor } from "@/lib/blur";
import { COLLECTIONS, COLLECTION_BY_SLUG, DEMO_NOTICE } from "@/lib/constants";
import { getStore } from "@/lib/data";
import { sortProperties } from "@/lib/search/filters";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const collection = COLLECTION_BY_SLUG[(await props.params).slug];
  if (!collection) return { title: "Collection not found" };
  return pageMetadata({
    title: collection.name,
    description: collection.description,
    path: `/collections/${collection.slug}`,
    image: collection.image.url,
    imageAlt: collection.image.alt,
  });
}

export default async function CollectionPage(props: PageProps<"/collections/[slug]">) {
  const collection = COLLECTION_BY_SLUG[(await props.params).slug];
  if (!collection) notFound();
  const properties = sortProperties(await getStore().getPropertiesByType(collection.type), "featured");
  const others = COLLECTIONS.filter((c) => c.slug !== collection.slug);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Collections", path: "/collections" },
          { name: collection.name, path: `/collections/${collection.slug}` },
        ])}
      />
      <header className="container-site grid gap-12 pb-[clamp(4rem,2.5rem+7.5vw,11rem)] pt-8 md:pt-12 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col lg:col-span-5">
          <nav aria-label="Breadcrumb" className="hero-fade">
            <ol className="flex flex-wrap items-center gap-1.5 text-[0.8125rem] text-muted">
              <li>
                <Link href="/collections" className="hover:text-ink">
                  Collections
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="size-3.5" strokeWidth={1.5} />
              </li>
              <li aria-current="page" className="text-ink">
                {collection.name}
              </li>
            </ol>
          </nav>
          <div className="mt-12 lg:mt-auto lg:pt-16">
            <p className="hero-fade eyebrow text-muted" style={{ animationDelay: "60ms" }}>
              {collection.kicker}
            </p>
            <h1 className="hero-fade mt-6 text-h1" style={{ animationDelay: "120ms" }}>
              {collection.name}
            </h1>
            <p className="hero-fade mt-8 max-w-md text-lead text-muted" style={{ animationDelay: "180ms" }}>
              {collection.description}
            </p>
            <p className="hero-fade mt-8 text-[0.875rem] text-muted" style={{ animationDelay: "240ms" }}>
              {properties.length === 1 ? "1 residence" : `${properties.length} residences`}
            </p>
          </div>
        </div>
        <div className="hero-fade relative aspect-[4/3] overflow-hidden bg-sand lg:col-span-7 lg:aspect-[5/4]" style={{ animationDelay: "200ms" }}>
          <Photo
            src={collection.image.url}
            alt={collection.image.alt}
            blurDataUrl={blurFor(collection.image.url)}
            fill
            preload
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover"
          />
        </div>
      </header>

      <section aria-label={`${collection.name} residences`} className="container-site pb-[clamp(4rem,2.5rem+7.5vw,11rem)]">
        {properties.length ? (
          <ul className="grid grid-cols-1 gap-x-8 gap-y-20 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-10">
            {properties.map((p, i) => (
              <li key={p.id} data-reveal="" style={{ ["--reveal-delay" as string]: (i % 3) * 90 }}>
                <PropertyCard property={p} headingLevel="h2" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            eyebrow="Collection"
            title="Nothing here just now"
            body="We don't have residences in this collection at the moment."
            action={
              <ButtonLink href="/properties" arrow>
                Explore all properties
              </ButtonLink>
            }
          />
        )}
        <p className="mt-24 max-w-2xl text-[0.75rem] leading-relaxed text-muted">{DEMO_NOTICE}</p>
      </section>

      <nav aria-label="Other collections" className="border-t border-line">
        <ul className="container-site">
          {others.map((c) => (
            <li key={c.slug} className="border-b border-line last:border-b-0">
              <Link href={`/collections/${c.slug}`} className="group flex min-h-24 items-center justify-between gap-6 py-6">
                <span className="font-serif text-[clamp(1.75rem,1.3rem+1.6vw,2.75rem)] leading-none transition-transform duration-500 ease-out-expo group-hover:translate-x-2">
                  {c.name}
                </span>
                <span className="hidden text-[0.875rem] text-muted sm:block">{c.kicker}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
