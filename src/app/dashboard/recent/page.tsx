import type { Metadata } from "next";
import { PanelHeading } from "@/components/dashboard/side-nav";
import { PropertyCard } from "@/components/property/property-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Recently viewed" };

export default async function DashboardRecentPage() {
  const user = await requireUser("/dashboard/recent");
  const recent = await getStore().listRecentlyViewed(user.id, 12);
  return (
    <>
      <PanelHeading title="Recently viewed" description="The last homes you opened while signed in." />
      {recent.length ? (
        <ul className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 xl:grid-cols-3">
          {recent.map(({ property, viewedAt }) => (
            <li key={property.id}>
              <PropertyCard property={property} headingLevel="h2" sizes="(min-width: 1280px) 24vw, (min-width: 768px) 40vw, 100vw" />
              <p className="mt-3 text-[0.75rem] text-muted">Viewed {formatDate(viewedAt, { day: "numeric", month: "short" })}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Nothing viewed yet"
          body="Homes you open while signed in will appear here so you can find them again."
          action={
            <ButtonLink href="/properties" arrow>
              Explore properties
            </ButtonLink>
          }
        />
      )}
    </>
  );
}
