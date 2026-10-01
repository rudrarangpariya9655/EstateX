"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Photo } from "@/components/ui/photo";
import { CITIES, COLLECTIONS, cityName } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { PropertySummary } from "@/lib/types";

type SearchStatus = "idle" | "loading" | "done" | "error";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PropertySummary[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const t = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { results: PropertySummary[] };
        setResults(data.results);
        setStatus("done");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus("error");
      }
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(t);
    };
  }, [query]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const trimmed = query.trim();
  const showResults = trimmed.length >= 2;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Search EstateX"
      variant="fullscreen"
      className="sm:h-auto sm:max-h-[92dvh] sm:border-b sm:border-line"
      bodyClassName="pb-10"
      closeLabel="Close search"
    >
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go(trimmed ? `/properties?q=${encodeURIComponent(trimmed)}` : "/properties");
        }}
        className="mx-auto w-full max-w-4xl"
      >
        <label htmlFor={inputId} className="sr-only">
          Search by city, neighborhood or residence
        </label>
        <div className="flex items-center gap-4 border-b border-ink/30 pb-3 focus-within:border-ink">
          <Search aria-hidden className="size-6 shrink-0 text-muted" strokeWidth={1.25} />
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="City, neighborhood or residence"
            autoComplete="off"
            enterKeyHint="search"
            aria-controls={showResults ? listId : undefined}
            className="min-w-0 flex-1 bg-transparent font-serif text-[1.75rem] leading-tight outline-none placeholder:text-muted/60 sm:text-[2.5rem]"
          />
          <button type="submit" className="inline-flex size-11 shrink-0 items-center justify-center" aria-label="Show all results">
            <ArrowRight aria-hidden className="size-5" strokeWidth={1.25} />
          </button>
        </div>

        <div className="mt-10" aria-live="polite">
          {showResults ? (
            <div>
              <p className="eyebrow text-muted">
                {status === "loading"
                  ? "Searching…"
                  : status === "error"
                    ? "Search is unavailable right now."
                    : results.length
                      ? "Residences"
                      : `No residences match “${trimmed}”.`}
              </p>
              {results.length ? (
                <ul id={listId} className="mt-4 divide-y divide-line border-y border-line">
                  {results.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/properties/${p.slug}`}
                        onClick={onClose}
                        className="group flex items-center gap-5 py-4 transition-colors hover:bg-ink/[0.03]"
                      >
                        <span className="relative block aspect-[4/3] w-20 shrink-0 overflow-hidden bg-sand sm:w-24">
                          <Photo src={p.cover?.url} alt="" fill sizes="96px" className="object-cover" blurDataUrl={p.cover?.blurDataUrl} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-serif text-[1.35rem] leading-tight">{p.name}</span>
                          <span className="block truncate text-[0.875rem] text-muted">
                            {p.locality}, {cityName(p.city)}
                          </span>
                        </span>
                        <span className="hidden text-[0.9375rem] sm:block">{formatPrice(p.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              <button
                type="submit"
                className="arrow-nudge mt-6 inline-flex items-center gap-2 border-b border-ink/30 pb-1 label-caps hover:border-ink"
              >
                See all results for “{trimmed}” <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <div className="grid gap-10 sm:grid-cols-2">
              <div>
                <p className="eyebrow text-muted">Cities</p>
                <ul className="mt-4 grid grid-cols-2 gap-x-6">
                  {CITIES.map((c) => (
                    <li key={c.slug}>
                      <button
                        type="button"
                        onClick={() => go(`/properties?city=${c.slug}`)}
                        className="flex min-h-11 w-full items-center text-left text-[1.0625rem] transition-opacity hover:opacity-60"
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow text-muted">Collections</p>
                <ul className="mt-4">
                  {COLLECTIONS.map((c) => (
                    <li key={c.slug}>
                      <button
                        type="button"
                        onClick={() => go(`/collections/${c.slug}`)}
                        className="flex min-h-11 w-full items-center text-left text-[1.0625rem] transition-opacity hover:opacity-60"
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </form>
    </Dialog>
  );
}
