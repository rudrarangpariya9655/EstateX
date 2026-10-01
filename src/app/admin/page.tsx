import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { VisitStatusLabel } from "@/components/dashboard/visit-list";
import { PanelHeading } from "@/components/dashboard/side-nav";
import { ArrowLink, ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { uploadTarget } from "@/lib/uploads";
import { formatDate, formatTimeSlot } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

/** Hairline separators for a 2-column (mobile) / 4-column (desktop) figure grid. */
const CELL_BORDERS = [
  "",
  "border-l border-line pl-6",
  "border-t border-line md:border-l md:border-t-0 md:pl-6",
  "border-l border-t border-line pl-6 md:border-t-0",
];

const STORAGE_LABEL = {
  cloudinary: "Cloudinary",
  supabase: "Supabase Storage",
  local: "Local disk (demo mode)",
};

export default async function AdminOverview() {
  await requireAdmin("/admin");
  const store = getStore();
  const [stats, pending, inquiries] = await Promise.all([
    store.getAdminStats(),
    store.listVisitRequests({ status: "pending" }),
    store.listInquiries(),
  ]);

  const catalogue = [
    { label: "Available", value: stats.available, href: "/admin/properties?status=available" },
    { label: "Reserved", value: stats.reserved, href: "/admin/properties?status=reserved" },
    { label: "Sold", value: stats.sold, href: "/admin/properties?status=sold" },
    { label: "Featured", value: stats.featured, href: "/admin/properties" },
  ];

  return (
    <>
      <PanelHeading
        title="Overview"
        description={`${stats.properties} residences · ${stats.users} registered users · data in ${store.mode === "supabase" ? "Supabase" : "the local demo store"}.`}
        actions={
          <ButtonLink href="/admin/properties/new" size="sm">
            <Plus aria-hidden className="size-4" strokeWidth={1.5} /> New property
          </ButtonLink>
        }
      />

      <section aria-labelledby="catalogue-heading">
        <h2 id="catalogue-heading" className="sr-only">
          Catalogue
        </h2>
        <dl className="grid grid-cols-2 border-y border-line md:grid-cols-4">
          {catalogue.map((c, i) => (
            <div key={c.label} className={CELL_BORDERS[i]}>
              <Link href={c.href} className="group flex flex-col gap-3 py-7">
                <dt className="text-[0.8125rem] text-muted group-hover:text-ink">{c.label}</dt>
                <dd className="font-serif text-[2.75rem] leading-none tabular-nums">{c.value}</dd>
              </Link>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-20 grid gap-20 xl:grid-cols-2 xl:gap-14">
        <section aria-labelledby="pending-heading">
          <div className="mb-6 flex items-baseline justify-between gap-6">
            <h2 id="pending-heading" className="text-[1.0625rem] font-medium">
              Awaiting confirmation <span className="text-muted">({pending.length})</span>
            </h2>
            <ArrowLink href="/admin/visits?status=pending">Review</ArrowLink>
          </div>
          {pending.length ? (
            <ul className="border-t border-line">
              {pending.slice(0, 5).map((v) => (
                <li key={v.id} className="flex items-start justify-between gap-6 border-b border-line py-5">
                  <div className="min-w-0">
                    <p className="truncate text-[0.9375rem] font-medium">{v.name}</p>
                    <p className="mt-1 truncate text-[0.8125rem] text-muted">
                      {v.property?.name ?? "Withdrawn residence"} · {formatDate(v.preferredDate, { day: "numeric", month: "short" })},{" "}
                      {formatTimeSlot(v.preferredTime)}
                    </p>
                  </div>
                  <VisitStatusLabel status={v.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-t border-line pt-6 text-[0.9375rem] text-muted">No requests waiting. </p>
          )}
        </section>

        <section aria-labelledby="inquiries-heading">
          <div className="mb-6 flex items-baseline justify-between gap-6">
            <h2 id="inquiries-heading" className="text-[1.0625rem] font-medium">
              Latest inquiries
            </h2>
            <ArrowLink href="/admin/inquiries">All inquiries</ArrowLink>
          </div>
          {inquiries.length ? (
            <ul className="border-t border-line">
              {inquiries.slice(0, 5).map((q) => (
                <li key={q.id} className="border-b border-line py-5">
                  <div className="flex items-baseline justify-between gap-6">
                    <p className="truncate text-[0.9375rem] font-medium">{q.name}</p>
                    <span className="shrink-0 text-[0.75rem] text-muted">{formatDate(q.createdAt, { day: "numeric", month: "short" })}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[0.8125rem] text-muted">
                    <span className="text-ink">{q.topic === "listing" ? "Listing" : "General"}</span> · {q.message}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-t border-line pt-6 text-[0.9375rem] text-muted">No inquiries yet.</p>
          )}
        </section>
      </div>

      <p className="mt-20 border-t border-line pt-6 text-[0.8125rem] text-muted">
        Image uploads are stored in: <span className="text-ink">{STORAGE_LABEL[uploadTarget()]}</span>
      </p>
    </>
  );
}
