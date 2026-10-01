"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Photo } from "@/components/ui/photo";
import { cn } from "@/lib/cn";

export interface ShowcaseItem {
  slug: string;
  name: string;
  kicker: string;
  description: string;
  count: number;
  image: { url: string; alt: string; blurDataUrl?: string | null };
}

/**
 * Editorial index of collections: a numbered list on the left drives a single
 * large image on the right (desktop). On smaller screens each entry carries its own image.
 */
export function CollectionsShowcase({ items }: { items: ShowcaseItem[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-16 lg:grid-cols-12 lg:gap-10">
      <ol className="lg:col-span-6 xl:col-span-5">
        {items.map((item, i) => (
          <li key={item.slug} className="border-t border-line last:border-b">
            <Link
              href={`/collections/${item.slug}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className="group block py-8 lg:py-10"
            >
              <div className="relative mb-6 aspect-[4/3] overflow-hidden bg-sand lg:hidden">
                <Photo
                  src={item.image.url}
                  alt={item.image.alt}
                  blurDataUrl={item.image.blurDataUrl}
                  fill
                  sizes="(min-width: 768px) 80vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex items-baseline gap-6">
                <span className="w-8 shrink-0 text-[0.8125rem] tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3
                      className={cn(
                        "font-serif text-[2.25rem] leading-none transition-[color,transform] duration-500 ease-out-expo md:text-[2.75rem]",
                        "lg:group-hover:translate-x-2",
                        active === i ? "lg:text-ink" : "lg:text-ink/45",
                      )}
                    >
                      {item.name}
                    </h3>
                    <span className="shrink-0 text-[0.8125rem] text-muted">
                      {item.count} {item.count === 1 ? "home" : "homes"}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-4 max-w-md text-[0.9375rem] leading-relaxed text-muted transition-[opacity,max-height] duration-500 ease-out-expo",
                      active === i ? "lg:max-h-40 lg:opacity-100" : "lg:max-h-0 lg:overflow-hidden lg:opacity-0",
                    )}
                  >
                    {item.description}
                  </p>
                  <span className="arrow-nudge mt-5 inline-flex items-center gap-2 label-caps text-[0.68rem] lg:hidden">
                    View collection <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.5} />
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <div className="relative hidden lg:col-span-6 lg:col-start-7 lg:block xl:col-span-6 xl:col-start-7">
        <div className="sticky top-28 aspect-[4/5] overflow-hidden bg-sand">
          {items.map((item, i) => (
            <div
              key={item.slug}
              aria-hidden={active !== i}
              className={cn(
                "absolute inset-0 transition-[opacity,transform] duration-[900ms] ease-out-expo",
                active === i ? "scale-100 opacity-100" : "scale-[1.03] opacity-0",
              )}
            >
              <Photo
                src={item.image.url}
                alt={active === i ? item.image.alt : ""}
                blurDataUrl={item.image.blurDataUrl}
                fill
                sizes="45vw"
                className="object-cover"
              />
            </div>
          ))}
          <div className="absolute bottom-0 left-0 bg-surface px-6 py-4">
            <p className="eyebrow text-muted">{items[active]?.kicker}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
