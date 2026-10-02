"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cancelVisitAction } from "@/app/actions/visits";
import { useToast } from "@/components/providers/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Photo } from "@/components/ui/photo";
import { VISIT_STATUS_LABELS, cityName } from "@/lib/constants";
import { formatDate, formatTimeSlot } from "@/lib/format";
import type { VisitRequest, VisitStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const TONE: Record<VisitStatus, string> = {
  pending: "text-[#7a5f37]",
  confirmed: "text-accent",
  declined: "text-muted",
  completed: "text-muted",
  cancelled: "text-muted",
};

export function VisitStatusLabel({ status }: { status: VisitStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[0.8125rem]", TONE[status])}>
      <span aria-hidden className={cn("size-1.5 rounded-full bg-current", status === "cancelled" && "opacity-50")} />
      {VISIT_STATUS_LABELS[status]}
    </span>
  );
}

export function VisitList({ visits, cancellable, muted }: { visits: VisitRequest[]; cancellable?: boolean; muted?: boolean }) {
  const router = useRouter();
  const { notify } = useToast();

  return (
    <ul className="border-t border-line">
      {visits.map((visit) => {
        const p = visit.property;
        const canCancel = cancellable && (visit.status === "pending" || visit.status === "confirmed");
        return (
          <li key={visit.id} className={cn("grid grid-cols-[4.5rem_minmax(0,1fr)] gap-5 border-b border-line py-6 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center sm:gap-8", muted && "opacity-80")}>
            <div className="relative aspect-square overflow-hidden bg-sand">
              <Photo src={p?.cover?.url} alt="" fill sizes="96px" className="object-cover" />
            </div>
            <div className="min-w-0">
              {p ? (
                <Link href={`/properties/${p.slug}`} className="hit-area font-serif text-[1.375rem] leading-tight hover:underline hover:decoration-1 hover:underline-offset-4">
                  {p.name}
                </Link>
              ) : (
                <p className="font-serif text-[1.375rem] leading-tight">Residence no longer listed</p>
              )}
              <p className="mt-1 truncate text-[0.8125rem] text-muted">
                {p ? `${p.locality}, ${cityName(p.city)} · ` : ""}
                {formatDate(visit.preferredDate, { weekday: "short", day: "numeric", month: "short" })} at {formatTimeSlot(visit.preferredTime)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
                <VisitStatusLabel status={visit.status} />
                <span className="text-[0.75rem] tabular-nums text-muted">Ref. {visit.reference}</span>
              </div>
            </div>
            {canCancel ? (
              <div className="col-span-2 sm:col-span-1">
                <ConfirmDialog
                  title="Cancel this visit request?"
                  description={`Your advisor will be told you no longer wish to visit ${p?.name ?? "this residence"}. You can request a new visit at any time.`}
                  confirmLabel="Cancel request"
                  onConfirm={async () => {
                    const result = await cancelVisitAction(visit.id);
                    notify(result.message, { tone: result.ok ? "neutral" : "error" });
                    if (result.ok) router.refresh();
                  }}
                >
                  {(open) => (
                    <button type="button" onClick={open} className="min-h-11 text-[0.8125rem] text-muted underline underline-offset-4 hover:text-danger">
                      Cancel request
                    </button>
                  )}
                </ConfirmDialog>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
