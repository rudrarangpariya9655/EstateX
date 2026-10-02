"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { submitInquiryAction } from "@/app/actions/inquiries";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea, describedBy } from "@/components/ui/field";
import { CITIES, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { PROPERTY_TYPES, type InquiryTopic } from "@/lib/types";
import { idleState } from "@/lib/validation";

/** Contact / list-your-property form. Submissions are stored for an advisor to answer. */
export function InquiryForm({ topic }: { topic: InquiryTopic }) {
  const id = useId();
  const [state, action, pending] = useActionState(submitInquiryAction, idleState);
  const { user } = useSession();
  const successRef = useRef<HTMLDivElement>(null);
  const listing = topic === "listing";

  useEffect(() => {
    if (state.status === "success") successRef.current?.focus();
  }, [state.status]);

  if (state.status === "success" && state.data) {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="border-t-2 border-accent bg-surface p-8 outline-none sm:p-10">
        <p className="eyebrow text-accent">Message received</p>
        <p className="mt-5 font-serif text-[2rem] leading-tight">Thank you, {state.data.name}.</p>
        <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">
          {listing
            ? "An advisor will review the details of your property and reply"
            : "An advisor will read your message and reply"}{" "}
          to <span className="text-ink">{state.data.email}</span>, usually within two working days.
        </p>
      </div>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const values = state.status === "error" ? state.values : undefined;

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      <input type="hidden" name="topic" value={topic} />
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
        <Field id={`${id}-phone`} label="Phone" optional error={errors?.phone}>
          <Input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91"
            defaultValue={values?.phone ?? ""}
            {...describedBy(`${id}-phone`, errors?.phone)}
          />
        </Field>

        {listing ? (
          <>
            <Field id={`${id}-city`} label="City" error={errors?.city}>
              <Select id={`${id}-city`} name="city" required defaultValue={values?.city ?? ""} {...describedBy(`${id}-city`, errors?.city)}>
                <option value="" disabled>
                  Choose a city
                </option>
                {CITIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id={`${id}-type`} label="Property type" error={errors?.propertyType}>
              <Select
                id={`${id}-type`}
                name="propertyType"
                required
                defaultValue={values?.propertyType ?? ""}
                {...describedBy(`${id}-type`, errors?.propertyType)}
              >
                <option value="" disabled>
                  Choose a type
                </option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PROPERTY_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id={`${id}-price`} label="Expected price" optional error={errors?.expectedPrice} className="sm:col-span-2">
              <Input
                id={`${id}-price`}
                name="expectedPrice"
                placeholder="e.g. ₹4.5 Cr"
                maxLength={40}
                defaultValue={values?.expectedPrice ?? ""}
                {...describedBy(`${id}-price`, errors?.expectedPrice)}
              />
            </Field>
          </>
        ) : null}

        <Field
          id={`${id}-message`}
          label={listing ? "About the property" : "Message"}
          error={errors?.message}
          className="sm:col-span-2"
        >
          <Textarea
            id={`${id}-message`}
            name="message"
            rows={5}
            required
            maxLength={2000}
            placeholder={
              listing
                ? "Locality, size, the architecture, anything that makes it special…"
                : "Where you're looking, what matters to you, your timeline…"
            }
            defaultValue={values?.message ?? ""}
            {...describedBy(`${id}-message`, errors?.message)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-[0.8125rem] leading-relaxed text-muted">
          We use your details only to reply. No mailing lists.
        </p>
        <Button type="submit" loading={pending} arrow={!pending}>
          {pending ? "Sending" : listing ? "Submit property" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
