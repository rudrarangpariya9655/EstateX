"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useCompare } from "@/components/providers/compare-provider";
import { Photo } from "@/components/ui/photo";
import { buttonClasses } from "@/components/ui/button";
import { MAX_COMPARE } from "@/lib/constants";
import { cn } from "@/lib/cn";

/** Floating comparison tray — appears only once something has been added. */
export function CompareTray() {
  const pathname = usePathname();
  const { ready, items, remove, clear } = useCompare();

  const hidden =
    !ready ||
    items.length === 0 ||
    pathname.startsWith("/compare") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/sign-") ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";
  if (hidden) return null;

  const onPropertyPage = /^\/properties\/[^/]+$/.test(pathname);
  const href = `/compare?ids=${items.map((i) => i.id).join(",")}`;

  return (
    <aside
      aria-label="Comparison"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 animate-fade-up border-t border-line bg-surface/95 backdrop-blur-md md:inset-x-auto md:bottom-6 md:right-6 md:border md:shadow-[0_24px_48px_-30px_rgb(21_21_21/0.5)]",
        onPropertyPage && "hidden md:block",
      )}
    >
      <div className="flex items-center gap-4 px-4 py-3 md:gap-5 md:px-5">
        <div className="hidden items-center gap-2 sm:flex">
          {items.map((item) => (
            <div key={item.id} className="group relative size-12 overflow-hidden bg-sand">
              <Photo src={item.coverUrl} alt="" fill sizes="48px" className="object-cover" />
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={`Remove ${item.name} from comparison`}
                className="absolute inset-0 flex items-center justify-center bg-ink/60 text-ivory opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
              >
                <X aria-hidden className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          ))}
          {Array.from({ length: MAX_COMPARE - items.length }).map((_, i) => (
            <div key={i} aria-hidden className="size-12 border border-dashed border-line" />
          ))}
        </div>
        <div className="min-w-0 flex-1 md:flex-none">
          <p className="text-[0.875rem] font-medium">
            {items.length} of {MAX_COMPARE} selected
          </p>
          <button type="button" onClick={clear} className="hit-area text-[0.8125rem] text-muted underline-offset-4 hover:text-ink hover:underline">
            Clear
          </button>
        </div>
        {items.length >= 2 ? (
          <Link href={href} className={buttonClasses({ size: "sm", className: "arrow-nudge" })}>
            Compare
          </Link>
        ) : (
          <span className="max-w-[9rem] text-[0.8125rem] leading-snug text-muted">Add one more residence to compare</span>
        )}
      </div>
    </aside>
  );
}
