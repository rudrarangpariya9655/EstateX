import type { Metadata } from "next";
import Link from "next/link";
import { VisitStatusSelect } from "@/components/admin/visit-status-select";
import { PanelHeading } from "@/components/dashboard/side-nav";
import { requireAdmin } from "@/lib/auth";
import { VISIT_STATUS_LABELS, cityName } from "@/lib/constants";
import { getStore } from "@/lib/data";
import { formatDate, formatTimeSlot } from "@/lib/format";
import { VISIT_STATUSES, type VisitStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Visit requests" };

export default async function AdminVisitsPage(props: PageProps<"/admin/visits">) {
  await requireAdmin("/admin/visits");
  const raw = (await props.searchParams).status;
  const status = (VISIT_STATUSES as readonly string[]).includes(String(raw)) ? (raw as VisitStatus) : undefined;
  const visits = await getStore().listVisitRequests({ status });
  const tabs = [{ value: undefined as VisitStatus | undefined, label: "All" }, ...VISIT_STATUSES.map((s) => ({ value: s, label: VISIT_STATUS_LABELS[s] }))];

  return (
    <>
      <PanelHeading
        title="Visit requests"
        description="Confirm a request only after you've agreed a time with the visitor — they see this status in their dashboard."
      />
      <nav aria-label="Filter by status" className="mb-10">
        <ul className="no-scrollbar -mx-1 flex gap-x-6 overflow-x-auto px-1 text-[0.875rem]">
          {tabs.map((t) => (
            <li key={t.label} className="shrink-0">
              <Link
                href={t.value ? `/admin/visits?status=${t.value}` : "/admin/visits"}
                aria-current={status === t.value ? "page" : undefined}
                className={cn("inline-flex min-h-11 items-center border-b whitespace-nowrap", status === t.value ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink")}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {visits.length === 0 ? (
        <p className="border-t border-line py-16 font-serif text-[1.75rem]">No requests here.</p>
      ) : (
        <ul className="border-t border-line">
          {visits.map((v) => (
            <li key={v.id} className="grid gap-5 border-b border-line py-7 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_12rem] md:gap-8">
              <div className="min-w-0">
                <p className="text-[0.9375rem] font-medium">{v.name}</p>
                <p className="mt-1 text-[0.8125rem] text-muted">
                  <a href={`mailto:${v.email}`} className="underline-offset-4 hover:text-ink hover:underline">
                    {v.email}
                  </a>{" "}
                  ·{" "}
                  <a href={`tel:${v.phone.replace(/[^\d+]/g, "")}`} className="underline-offset-4 hover:text-ink hover:underline">
                    {v.phone}
                  </a>
                </p>
                {v.message ? (
                  <details className="mt-3 text-[0.875rem]">
                    <summary className="inline-flex min-h-9 cursor-pointer items-center text-muted hover:text-ink">Message</summary>
                    <p className="mt-2 max-w-prose whitespace-pre-line leading-relaxed text-ink-soft">{v.message}</p>
                  </details>
                ) : null}
              </div>
              <div className="min-w-0 text-[0.875rem]">
                {v.property ? (
                  <Link href={`/properties/${v.property.slug}`} className="font-serif text-[1.25rem] leading-tight hover:underline hover:decoration-1 hover:underline-offset-4">
                    {v.property.name}
                  </Link>
                ) : (
                  <span className="text-muted">Withdrawn residence</span>
                )}
                <p className="mt-1 text-muted">
                  {v.property ? `${cityName(v.property.city)} · ` : ""}
                  {formatDate(v.preferredDate, { weekday: "short", day: "numeric", month: "short" })}, {formatTimeSlot(v.preferredTime)}
                </p>
                <p className="mt-1 text-[0.75rem] tabular-nums text-muted">
                  Ref. {v.reference} · received {formatDate(v.createdAt, { day: "numeric", month: "short" })}
                </p>
              </div>
              <div>
                <VisitStatusSelect id={v.id} status={v.status} name={v.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
