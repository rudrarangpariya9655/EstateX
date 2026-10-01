"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property/property-card";
import { useFavorites, useSession } from "@/components/providers/session-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { PropertySummary } from "@/lib/types";

type Status = "idle" | "loading" | "error";

/**
 * Saved homes for everyone: ids come from the account (signed in) or this
 * device (guest); summaries are fetched once and kept as hearts are toggled,
 * so un-saving removes a card without a reload.
 */
export function SavedCollection({ headingLevel = "h2" }: { headingLevel?: "h2" | "h3" }) {
  const favorites = useFavorites();
  const { user } = useSession();
  const [byId, setById] = useState<Record<string, PropertySummary>>({});
  const [missing, setMissing] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>("idle");
  const [attempt, setAttempt] = useState(0);

  const unknown = useMemo(
    () => favorites.ids.filter((id) => !byId[id] && !missing.has(id)),
    [favorites.ids, byId, missing],
  );

  useEffect(() => {
    if (!favorites.ready || unknown.length === 0) return;
    const controller = new AbortController();
    const load = async () => {
      setStatus("loading");
      try {
        const res = await fetch(`/api/properties?ids=${unknown.slice(0, 100).join(",")}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        const { properties } = (await res.json()) as { properties: PropertySummary[] };
        setById((prev) => ({ ...prev, ...Object.fromEntries(properties.map((p) => [p.id, p])) }));
        // Ids that no longer exist (withdrawn listings) are skipped rather than refetched forever.
        const found = new Set(properties.map((p) => p.id));
        setMissing((prev) => new Set([...prev, ...unknown.filter((id) => !found.has(id))]));
        setStatus("idle");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus("error");
      }
    };
    void load();
    return () => controller.abort();
  }, [favorites.ready, unknown, attempt]);

  const items = favorites.ids.map((id) => byId[id]).filter((p): p is PropertySummary => Boolean(p));

  if (!favorites.ready || (status === "loading" && items.length === 0)) {
    return (
      <div aria-busy="true" aria-label="Loading saved homes" className="grid grid-cols-1 gap-x-8 gap-y-20 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-10">
        {Array.from({ length: Math.min(Math.max(favorites.ids.length, 2), 3) }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === "error" && items.length === 0) {
    return (
      <EmptyState
        eyebrow="Something went wrong"
        title="We couldn't load your saved homes"
        body="Your collection is safe. Please try again in a moment."
        action={<Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        eyebrow="Saved homes"
        title="Your collection is empty"
        body="Save properties you love and return to them anytime."
        action={
          <ButtonLink href="/properties" arrow>
            Explore properties
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div>
      {!user ? (
        <p className="mb-14 max-w-xl border-l-2 border-accent pl-5 text-[0.9375rem] leading-relaxed text-muted md:mb-20">
          These homes are saved on this device.{" "}
          <Link href="/sign-in?next=/saved" className="text-ink underline underline-offset-4">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/sign-up?next=/saved" className="text-ink underline underline-offset-4">
            create an account
          </Link>{" "}
          to keep them everywhere.
        </p>
      ) : null}
      <ul className="grid grid-cols-1 gap-x-8 gap-y-20 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-10">
        {items.map((property) => (
          <li key={property.id}>
            <PropertyCard property={property} headingLevel={headingLevel} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SavedCount() {
  const favorites = useFavorites();
  if (!favorites.ready) return <span aria-hidden className="inline-block h-4 w-20 skeleton align-middle" />;
  const n = favorites.ids.length;
  return <>{n === 0 ? "Nothing saved yet" : n === 1 ? "1 home saved" : `${n} homes saved`}</>;
}
