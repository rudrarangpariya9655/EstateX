import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { searchHref, type SearchState } from "@/lib/search/filters";
import { cn } from "@/lib/cn";

/** Page links that preserve the current filters. */
export function Pagination({ state, page, pageCount }: { state: SearchState; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => `${searchHref({ ...state, page: p })}#results`;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  const edge = "inline-flex h-12 items-center gap-2 px-2 label-caps transition-opacity";
  return (
    <nav aria-label="Pagination" className="mt-24 flex items-center justify-between border-t border-line pt-8">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(edge, "arrow-nudge hover:opacity-60")} rel="prev">
          <ArrowLeft aria-hidden className="size-4" strokeWidth={1.5} /> Previous
        </Link>
      ) : (
        <span className={cn(edge, "opacity-30")} aria-hidden>
          <ArrowLeft className="size-4" strokeWidth={1.5} /> Previous
        </span>
      )}
      <ol className="flex items-center gap-1">
        {pages.map((p) => (
          <li key={p}>
            <Link
              href={href(p)}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
              className={cn(
                "inline-flex size-11 items-center justify-center text-[0.875rem] tabular-nums transition-colors",
                p === page ? "bg-ink text-ivory" : "hover:bg-ink/5",
              )}
            >
              {p}
            </Link>
          </li>
        ))}
      </ol>
      {page < pageCount ? (
        <Link href={href(page + 1)} className={cn(edge, "arrow-nudge hover:opacity-60")} rel="next">
          Next <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
        </Link>
      ) : (
        <span className={cn(edge, "opacity-30")} aria-hidden>
          Next <ArrowRight className="size-4" strokeWidth={1.5} />
        </span>
      )}
    </nav>
  );
}
