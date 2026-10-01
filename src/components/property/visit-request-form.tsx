"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef } from "react";
import { requestVisitAction } from "@/app/actions/visits";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea, describedBy } from "@/components/ui/field";
import { VISIT_TIME_SLOTS } from "@/lib/constants";
import { addDays, formatTimeSlot, todayInIndia } from "@/lib/format";
import { MAX_VISIT_DAYS_AHEAD, idleState } from "@/lib/validation";

export function VisitRequestForm({ propertyId, propertyName }: { propertyId: string; propertyName: string }) {
  const id = useId();
  const [state, action, pending] = useActionState(requestVisitAction, idleState);
  const { user } = useSession();
  const successRef = useRef<HTMLDivElement>(null);
  const today = todayInIndia();
  const latest = addDays(today, MAX_VISIT_DAYS_AHEAD);

  useEffect(() => {
    if (state.status === "success") successRef.current?.focus();
  }, [state.status]);

  if (state.status === "success" && state.data) {
    return (
      <div ref={successRef} tabIndex={-1} className="border-t-2 border-accent bg-surface p-8 outline-none sm:p-10" role="status">
        <p className="eyebrow text-accent">Visit request received</p>
        <p className="mt-5 font-serif text-[2rem] leading-tight">Thank you — we&apos;ll be in touch shortly.</p>
        <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">
          You asked to see {propertyName} on <span className="text-ink">{state.data.date}</span> at{" "}
          <span className="text-ink">{state.data.time}</span>. An advisor will contact you at {state.data.email} to
          confirm a time. Your visit is not confirmed until you hear from us.
        </p>
        <p className="mt-6 text-[0.8125rem] text-muted">
          Reference <span className="font-medium tabular-nums text-ink">{state.data.reference}</span>
        </p>
        {user ? (
          <Link href="/dashboard/visits" className="mt-8 inline-flex border-b border-ink/30 pb-1 label-caps hover:border-ink">
            Track your requests
          </Link>
        ) : null}
      </div>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const values = state.status === "error" ? state.values : undefined;

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      <input type="hidden" name="propertyId" value={propertyId} />
      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={`${id}-name`} label="Full name" error={errors?.name} className="sm:col-span-2">
          <Input
            id={`${id}-name`}
            name="name"
            autoComplete="name"
            required
            defaultValue={values?.name ?? user?.fullName ?? ""}
            key={`name-${user?.id ?? "guest"}`}
            {...describedBy(`${id}-name`, errors?.name)}
          />
        </Field>
        <Field id={`${id}-email`} label="Email" error={errors?.email}>
          <Input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={values?.email ?? user?.email ?? ""}
            key={`email-${user?.id ?? "guest"}`}
            {...describedBy(`${id}-email`, errors?.email)}
          />
        </Field>
        <Field id={`${id}-phone`} label="Phone" error={errors?.phone}>
          <Input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91"
            required
            defaultValue={values?.phone ?? ""}
            {...describedBy(`${id}-phone`, errors?.phone)}
          />
        </Field>
        <Field id={`${id}-date`} label="Preferred date" error={errors?.preferredDate}>
          <Input
            id={`${id}-date`}
            name="preferredDate"
            type="date"
            min={today}
            max={latest}
            required
            defaultValue={values?.preferredDate ?? ""}
            {...describedBy(`${id}-date`, errors?.preferredDate)}
          />
        </Field>
        <Field id={`${id}-time`} label="Preferred time" error={errors?.preferredTime}>
          <Select
            id={`${id}-time`}
            name="preferredTime"
            required
            defaultValue={values?.preferredTime ?? ""}
            {...describedBy(`${id}-time`, errors?.preferredTime)}
          >
            <option value="" disabled>
              Choose a time
            </option>
            {VISIT_TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {formatTimeSlot(slot)}
              </option>
            ))}
          </Select>
        </Field>
        <Field id={`${id}-message`} label="Message" optional error={errors?.message} className="sm:col-span-2">
          <Textarea
            id={`${id}-message`}
            name="message"
            rows={4}
            maxLength={1000}
            placeholder="Anything we should know — who's visiting, questions about the home…"
            defaultValue={values?.message ?? ""}
            {...describedBy(`${id}-message`, errors?.message)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-[0.8125rem] leading-relaxed text-muted">
          We&apos;ll use these details only to arrange your visit.
        </p>
        <Button type="submit" loading={pending} arrow={!pending}>
          {pending ? "Sending" : "Request visit"}
        </Button>
      </div>
    </form>
  );
}
