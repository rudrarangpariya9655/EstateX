import type { Metadata } from "next";
import Link from "next/link";
import { PanelHeading } from "@/components/dashboard/side-nav";
import { VisitList } from "@/components/dashboard/visit-list";
import { ArrowLink, ButtonLink } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { Photo } from "@/components/ui/photo";
import { requireUser } from "@/lib/auth";
import { cityName } from "@/lib/constants";
import { getStore } from "@/lib/data";
import { formatPrice, todayInIndia } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardOverview(props: PageProps<"/dashboard">) {
  const user = await requireUser("/dashboard");
  const notice = (await props.searchParams).notice;
  const store = getStore();
  const [favorites, visits, recent] = await Promise.all([
    store.listFavoriteIds(user.id),
    store.listVisitRequests({ userId: user.id }),
    store.listRecentlyViewed(user.id, 4),
  ]);
  const today = todayInIndia();
  const open = visits.filter((v) => (v.status === "pending" || v.status === "confirmed") && v.preferredDate >= today);
  const firstName = user.fullName.split(" ")[0] || "there";

  const stats = [
    { label: "Saved homes", value: favorites.length, href: "/dashboard/saved" },
    { label: "Open visit requests", value: open.length, href: "/dashboard/visits" },
    { label: "Recently viewed", value: recent.length, href: "/dashboard/recent" },
  ];

  return (
    <>
      {notice === "admin-only" ? (
        <div className="mb-10">
          <FormMessage tone="info">That area is for EstateX administrators. You&apos;ve been brought to your dashboard instead.</FormMessage>
        </div>
      ) : null}
      <PanelHeading title={`Hello, ${firstName}.`} description="Everything you've saved and asked about, in one place." />

      <dl className="grid grid-cols-1 border-y border-line sm:grid-cols-3">
        {stats.map((s, i) => (
          <div key={s.label} className={i ? "border-t border-line sm:border-l sm:border-t-0 sm:pl-8" : ""}>
            <Link href={s.href} className="group flex flex-col gap-3 py-7 sm:py-9">
              <dt className="text-[0.8125rem] text-muted group-hover:text-ink">{s.label}</dt>
              <dd className="font-serif text-[3rem] leading-none tabular-nums">{s.value}</dd>
            </Link>
          </div>
        ))}
      </dl>

      <section aria-labelledby="upcoming-heading" className="mt-20 md:mt-24">
        <div className="mb-8 flex items-baseline justify-between gap-6">
          <h2 id="upcoming-heading" className="text-[1.0625rem] font-medium">
            Upcoming visit requests
          </h2>
          {visits.length ? <ArrowLink href="/dashboard/visits">All requests</ArrowLink> : null}
        </div>
        {open.length ? (
          <VisitList visits={open.slice(0, 3)} />
        ) : (
          <p className="border-t border-line pt-8 text-[0.9375rem] text-muted">
            No upcoming requests. When you ask to see a home, you&apos;ll follow it here.
          </p>
        )}
      </section>

      <section aria-labelledby="recent-heading" className="mt-20 md:mt-24">
        <div className="mb-8 flex items-baseline justify-between gap-6">
          <h2 id="recent-heading" className="text-[1.0625rem] font-medium">
            Recently viewed
          </h2>
          {recent.length ? <ArrowLink href="/dashboard/recent">See all</ArrowLink> : null}
        </div>
        {recent.length ? (
          <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {recent.map(({ property }) => (
              <li key={property.id}>
                <Link href={`/properties/${property.slug}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                    <Photo
                      src={property.cover?.url}
                      alt={property.cover?.alt ?? ""}
                      blurDataUrl={property.cover?.blurDataUrl}
                      fill
                      sizes="(min-width: 768px) 18vw, 45vw"
                      className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-4 font-serif text-[1.25rem] leading-tight">{property.name}</p>
                  <p className="mt-1 text-[0.8125rem] text-muted">
                    {cityName(property.city)} · {formatPrice(property.price)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-6 border-t border-line pt-8">
            <p className="text-[0.9375rem] text-muted">Homes you open while signed in will appear here.</p>
            <ButtonLink href="/properties" variant="outline" size="sm" arrow>
              Explore properties
            </ButtonLink>
          </div>
        )}
      </section>
    </>
  );
}
