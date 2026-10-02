import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { FeaturedToggle, RowActions, StatusSelect } from "@/components/admin/property-row-actions";
import { PanelHeading } from "@/components/dashboard/side-nav";
import { Button, ButtonLink } from "@/components/ui/button";
import { Photo } from "@/components/ui/photo";
import { requireAdmin } from "@/lib/auth";
import { PROPERTY_TYPE_LABELS, STATUS_LABELS, cityName } from "@/lib/constants";
import { getStore } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";
import { PROPERTY_STATUSES, type PropertyStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Properties" };

export default async function AdminPropertiesPage(props: PageProps<"/admin/properties">) {
  await requireAdmin("/admin/properties");
  const params = await props.searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const status = (PROPERTY_STATUSES as readonly string[]).includes(String(params.status)) ? (params.status as PropertyStatus) : undefined;
  const properties = await getStore().listAllProperties({ q: q || undefined, status });

  const tabs = [{ value: undefined, label: "All" }, ...PROPERTY_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))];
  const tabHref = (value?: string) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (value) sp.set("status", value);
    const qs = sp.toString();
    return qs ? `/admin/properties?${qs}` : "/admin/properties";
  };

  return (
    <>
      <PanelHeading
        title="Properties"
        description="Create, edit and publish residences. Changes appear on the site immediately."
        actions={
          <ButtonLink href="/admin/properties/new" size="sm">
            <Plus aria-hidden className="size-4" strokeWidth={1.5} /> New property
          </ButtonLink>
        }
      />

      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Filter by status">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[0.875rem]">
            {tabs.map((t) => (
              <li key={t.label}>
                <Link
                  href={tabHref(t.value)}
                  aria-current={status === t.value ? "page" : undefined}
                  className={cn("inline-flex min-h-11 items-center border-b", status === t.value ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink")}
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form role="search" action="/admin/properties" className="flex w-full max-w-sm items-center gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <label htmlFor="admin-q" className="sr-only">
            Search properties
          </label>
          <div className="relative flex-1">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" strokeWidth={1.5} />
            <input
              id="admin-q"
              name="q"
              defaultValue={q}
              placeholder="Name, slug or locality"
              className="h-11 w-full border border-line bg-surface pl-9 pr-3 text-[0.875rem] outline-none focus:border-accent"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>
      </div>

      {properties.length === 0 ? (
        <div className="border-t border-line py-16">
          <p className="font-serif text-[1.75rem]">No properties match.</p>
          <Link href="/admin/properties" className="mt-4 inline-block text-[0.875rem] text-muted underline underline-offset-4 hover:text-ink">
            Clear filters
          </Link>
        </div>
      ) : (
        <ul className="border-t border-line">
          <li aria-hidden className="hidden grid-cols-[4.5rem_minmax(0,2.4fr)_minmax(0,1fr)_9rem_2.5rem_minmax(0,1.3fr)] gap-5 border-b border-line py-3 text-[0.75rem] text-muted xl:grid">
            <span />
            <span>Residence</span>
            <span>Price</span>
            <span>Status</span>
            <span>Feat.</span>
            <span />
          </li>
          {properties.map((p) => (
            <li
              key={p.id}
              className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-5 gap-y-4 border-b border-line py-5 xl:grid-cols-[4.5rem_minmax(0,2.4fr)_minmax(0,1fr)_9rem_2.5rem_minmax(0,1.3fr)]"
            >
              <div className="relative row-span-2 aspect-square self-start overflow-hidden bg-sand xl:row-span-1">
                <Photo src={p.cover?.url} alt="" fill sizes="72px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <Link href={`/admin/properties/${p.id}/edit`} className="-my-2 block truncate py-2 font-serif text-[1.375rem] leading-tight hover:underline hover:decoration-1 hover:underline-offset-4">
                  {p.name}
                </Link>
                <p className="mt-1 truncate text-[0.8125rem] text-muted">
                  {PROPERTY_TYPE_LABELS[p.type]} · {p.locality}, {cityName(p.city)} · <span className="tabular-nums xl:hidden">{formatPrice(p.price)}</span>
                  <span className="hidden xl:inline">added {formatDate(p.createdAt, { day: "numeric", month: "short", year: "numeric" })}</span>
                </p>
              </div>
              <p className="hidden text-[0.9375rem] tabular-nums xl:block">{formatPrice(p.price)}</p>
              <div className="col-start-2 flex flex-wrap items-center gap-x-4 gap-y-2 xl:contents">
                <div className="w-40 xl:w-auto">
                  <StatusSelect id={p.id} name={p.name} status={p.status} />
                </div>
                <FeaturedToggle id={p.id} name={p.name} featured={p.featured} />
                <RowActions id={p.id} slug={p.slug} name={p.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
