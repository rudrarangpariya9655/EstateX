import type { Metadata } from "next";
import { PanelHeading } from "@/components/dashboard/side-nav";
import { VisitList } from "@/components/dashboard/visit-list";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { todayInIndia } from "@/lib/format";

export const metadata: Metadata = { title: "Visit requests" };

export default async function DashboardVisitsPage() {
  const user = await requireUser("/dashboard/visits");
  const visits = await getStore().listVisitRequests({ userId: user.id });
  const today = todayInIndia();
  const upcoming = visits.filter((v) => v.preferredDate >= today && v.status !== "cancelled" && v.status !== "declined" && v.status !== "completed");
  const past = visits.filter((v) => !upcoming.includes(v));

  return (
    <>
      <PanelHeading
        title="Visit requests"
        description="A request becomes a visit once your advisor confirms the time with you."
      />
      {visits.length === 0 ? (
        <EmptyState
          title="No visit requests yet"
          body="When you find a home you'd like to see, request a visit from its page and follow it here."
          action={
            <ButtonLink href="/properties" arrow>
              Explore properties
            </ButtonLink>
          }
        />
      ) : (
        <div className="flex flex-col gap-20">
          <section aria-labelledby="upcoming">
            <h2 id="upcoming" className="mb-6 text-[1.0625rem] font-medium">
              Upcoming
            </h2>
            {upcoming.length ? <VisitList visits={upcoming} cancellable /> : <p className="border-t border-line pt-6 text-[0.9375rem] text-muted">Nothing upcoming.</p>}
          </section>
          {past.length ? (
            <section aria-labelledby="past">
              <h2 id="past" className="mb-6 text-[1.0625rem] font-medium">
                Past and closed
              </h2>
              <VisitList visits={past} muted />
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
