import type { Metadata } from "next";
import { PanelHeading } from "@/components/dashboard/side-nav";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Inquiries" };

const DETAIL_LABELS: Record<string, string> = { city: "City", propertyType: "Type", expectedPrice: "Expected price" };

export default async function AdminInquiriesPage() {
  await requireAdmin("/admin/inquiries");
  const inquiries = await getStore().listInquiries();
  return (
    <>
      <PanelHeading title="Inquiries" description="Messages from the contact and list-your-property forms." />
      {inquiries.length === 0 ? (
        <p className="border-t border-line py-16 font-serif text-[1.75rem]">No inquiries yet.</p>
      ) : (
        <ul className="border-t border-line">
          {inquiries.map((q) => (
            <li key={q.id} className="grid gap-4 border-b border-line py-7 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10">
              <div className="min-w-0">
                <p className="eyebrow text-accent">{q.topic === "listing" ? "List a property" : "General"}</p>
                <p className="mt-3 text-[0.9375rem] font-medium">{q.name}</p>
                <p className="mt-1 truncate text-[0.8125rem] text-muted">
                  <a href={`mailto:${q.email}`} className="underline-offset-4 hover:text-ink hover:underline">
                    {q.email}
                  </a>
                  {q.phone ? ` · ${q.phone}` : ""}
                </p>
                <p className="mt-1 text-[0.75rem] text-muted">{formatDate(q.createdAt, { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <div className="min-w-0">
                <p className="max-w-prose whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink-soft">{q.message}</p>
                {q.details ? (
                  <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[0.8125rem]">
                    {Object.entries(q.details).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="text-muted">{DETAIL_LABELS[k] ?? k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
