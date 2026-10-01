"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { setVisitStatusAction } from "@/app/actions/admin";
import { useToast } from "@/components/providers/toast-provider";
import { VISIT_STATUS_LABELS } from "@/lib/constants";
import { VISIT_STATUSES, type VisitStatus } from "@/lib/types";

export function VisitStatusSelect({ id, status, name }: { id: string; status: VisitStatus; name: string }) {
  const selectId = useId();
  const router = useRouter();
  const { notify } = useToast();
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <label htmlFor={selectId} className="sr-only">
        Status of {name}&apos;s request
      </label>
      <select
        id={selectId}
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as VisitStatus;
          const previous = value;
          setValue(next);
          startTransition(async () => {
            const result = await setVisitStatusAction(id, next);
            if (!result.ok) setValue(previous);
            notify(result.ok ? `Request marked “${VISIT_STATUS_LABELS[next].toLowerCase()}”.` : result.message, { tone: result.ok ? "neutral" : "error" });
            router.refresh();
          });
        }}
        className="ex-select h-10 w-full min-w-[12rem] appearance-none border border-line bg-surface pl-3 pr-9 text-[0.8125rem] outline-none focus:border-accent disabled:opacity-60"
      >
        {VISIT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {VISIT_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </>
  );
}
