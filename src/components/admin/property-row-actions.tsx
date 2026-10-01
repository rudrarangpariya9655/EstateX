"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Star } from "lucide-react";
import { deletePropertyAction, setPropertyFeaturedAction, setPropertyStatusAction } from "@/app/actions/admin";
import { useToast } from "@/components/providers/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { STATUS_LABELS } from "@/lib/constants";
import { PROPERTY_STATUSES, type PropertyStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

export function StatusSelect({ id, name, status }: { id: string; name: string; status: PropertyStatus }) {
  const selectId = useId();
  const router = useRouter();
  const { notify } = useToast();
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center">
      <label htmlFor={selectId} className="sr-only">
        Status of {name}
      </label>
      <select
        id={selectId}
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as PropertyStatus;
          const previous = value;
          setValue(next);
          startTransition(async () => {
            const result = await setPropertyStatusAction(id, next);
            if (!result.ok) setValue(previous);
            notify(result.ok ? `${name} marked ${STATUS_LABELS[next].toLowerCase()}.` : result.message, { tone: result.ok ? "neutral" : "error" });
            router.refresh();
          });
        }}
        className="ex-select h-10 w-full min-w-[8.5rem] appearance-none border border-line bg-surface pl-3 pr-9 text-[0.8125rem] outline-none focus:border-accent disabled:opacity-60"
      >
        {PROPERTY_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FeaturedToggle({ id, name, featured }: { id: string; name: string; featured: boolean }) {
  const router = useRouter();
  const { notify } = useToast();
  const [value, setValue] = useState(featured);
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={value}
      disabled={pending}
      aria-label={value ? `Unfeature ${name}` : `Feature ${name}`}
      title={value ? "Featured — click to unfeature" : "Not featured — click to feature"}
      onClick={() => {
        const next = !value;
        setValue(next);
        startTransition(async () => {
          const result = await setPropertyFeaturedAction(id, next);
          if (!result.ok) setValue(!next);
          notify(result.ok ? result.message : result.message, { tone: result.ok ? "neutral" : "error" });
          router.refresh();
        });
      }}
      className="inline-flex size-10 items-center justify-center transition-colors hover:bg-ink/5 disabled:opacity-50"
    >
      <Star aria-hidden className={cn("size-4", value ? "fill-accent text-accent" : "text-muted")} strokeWidth={1.5} />
    </button>
  );
}

export function RowActions({ id, slug, name }: { id: string; slug: string; name: string }) {
  const router = useRouter();
  const { notify } = useToast();
  return (
    <div className="flex items-center gap-4 text-[0.8125rem]">
      <Link href={`/properties/${slug}`} className="inline-flex min-h-10 items-center text-muted underline-offset-4 hover:text-ink hover:underline">
        View
      </Link>
      <Link href={`/admin/properties/${id}/edit`} className="inline-flex min-h-10 items-center underline-offset-4 hover:underline">
        Edit
      </Link>
      <ConfirmDialog
        title={`Delete ${name}?`}
        description="This permanently removes the residence, its photographs and floor plans from the catalogue, along with any saves and visit requests for it. This cannot be undone."
        confirmLabel="Delete property"
        onConfirm={async () => {
          const result = await deletePropertyAction(id);
          notify(result.ok ? `${name} has been deleted.` : result.message, { tone: result.ok ? "neutral" : "error" });
          if (result.ok) router.refresh();
        }}
      >
        {(open) => (
          <button type="button" onClick={open} className="inline-flex min-h-10 items-center text-danger underline-offset-4 hover:underline">
            Delete
          </button>
        )}
      </ConfirmDialog>
    </div>
  );
}
