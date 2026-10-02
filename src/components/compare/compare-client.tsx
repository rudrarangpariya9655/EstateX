"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { X } from "lucide-react";
import { useCompare } from "@/components/providers/compare-provider";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** With no ids in the URL, continue with the comparison stored on this device. */
export function CompareFromDevice() {
  const router = useRouter();
  const { ready, items } = useCompare();

  useEffect(() => {
    if (ready && items.length) router.replace(`/compare?ids=${items.map((i) => i.id).join(",")}`);
  }, [ready, items, router]);

  if (!ready || items.length) {
    return <div aria-busy="true" aria-label="Loading comparison" className="h-[50vh] skeleton" />;
  }
  return (
    <EmptyState
      eyebrow="Compare"
      title="Nothing to compare yet"
      body="Choose Compare on up to three residences — from the catalogue or any property page — and they'll appear here side by side."
      action={
        <ButtonLink href="/properties" arrow>
          Explore properties
        </ButtonLink>
      }
    />
  );
}

/** Removes a residence from the comparison (URL and device list stay in sync). */
export function RemoveFromCompare({ id, name, ids }: { id: string; name: string; ids: string[] }) {
  const router = useRouter();
  const compare = useCompare();
  return (
    <button
      type="button"
      onClick={() => {
        compare.remove(id);
        const rest = ids.filter((x) => x !== id);
        router.replace(rest.length ? `/compare?ids=${rest.join(",")}` : "/compare?cleared=1", { scroll: false });
      }}
      aria-label={`Remove ${name} from comparison`}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-ivory/90 text-ink backdrop-blur-sm transition-colors hover:bg-ivory"
    >
      <X aria-hidden className="size-4" strokeWidth={1.5} />
    </button>
  );
}

/** Keeps the device comparison list in step with a shared /compare link. */
export function SyncCompare({ items }: { items: { id: string; slug: string; name: string; coverUrl: string | null }[] }) {
  const compare = useCompare();
  const key = items.map((i) => i.id).join(",");
  useEffect(() => {
    if (!compare.ready) return;
    const current = compare.items.map((i) => i.id).join(",");
    if (current === key) return;
    compare.clear();
    for (const item of items) compare.toggle(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when the URL selection changes
  }, [compare.ready, key]);
  return null;
}
