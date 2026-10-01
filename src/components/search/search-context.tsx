"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useTransition, type ReactNode } from "react";
import { searchHref, type SearchState } from "@/lib/search/filters";

interface SearchContextValue {
  state: SearchState;
  pending: boolean;
  /** Merge changes into the current search and navigate (resets to page 1 unless a page is given). */
  update: (changes: Partial<SearchState>, options?: { replace?: boolean }) => void;
  reset: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

/**
 * URL-driven search state. The URL is the single source of truth, so results are
 * server-rendered, shareable and work with the back button; transitions keep
 * the current results visible (dimmed) while the next set loads.
 */
export function SearchProvider({ state, children }: { state: SearchState; children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (changes: Partial<SearchState>, options?: { replace?: boolean }) => {
      const next: SearchState = { ...state, page: 1, ...changes };
      const href = searchHref(next);
      startTransition(() => (options?.replace ? router.replace(href, { scroll: false }) : router.push(href, { scroll: false })));
    },
    [router, state],
  );

  const reset = useCallback(() => {
    startTransition(() => router.push(searchHref({ view: state.view, sort: state.sort }), { scroll: false }));
  }, [router, state.view, state.sort]);

  const value = useMemo(() => ({ state, pending, update, reset }), [state, pending, update, reset]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}
