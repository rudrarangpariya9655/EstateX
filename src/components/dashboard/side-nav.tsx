"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export interface SideNavItem {
  href: string;
  label: string;
  count?: number;
}

/** Section navigation for product areas: a vertical list on desktop, a scrollable tab strip on smaller screens. */
export function SideNav({ items, label, root }: { items: SideNavItem[]; label: string; root: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === root ? pathname === root : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <nav aria-label={label} className="-mx-[clamp(1.25rem,0.6rem+3.2vw,4.5rem)] border-b border-line lg:mx-0 lg:border-b-0">
      <ul className="no-scrollbar flex gap-1 overflow-x-auto px-[clamp(1.25rem,0.6rem+3.2vw,4.5rem)] lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center justify-between gap-6 whitespace-nowrap border-b-2 px-3 text-[0.875rem] transition-colors lg:border-b-0 lg:border-l-2 lg:px-5",
                  active ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink",
                )}
              >
                {item.label}
                {item.count ? <span className="text-[0.75rem] tabular-nums text-muted">{item.count}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Page heading used inside the dashboard and admin. */
export function PanelHeading({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-12 flex flex-col gap-6 border-b border-line pb-8 md:mb-14 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-serif text-[2.5rem] leading-none md:text-[3rem]">{title}</h1>
        {description ? <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
