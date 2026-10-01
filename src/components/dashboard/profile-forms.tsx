"use client";

import { useActionState, useId } from "react";
import { changePasswordAction, updateProfileAction } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, describedBy } from "@/components/ui/field";
import { idleState } from "@/lib/validation";

export function ProfileForm({ fullName, phone, email }: { fullName: string; phone: string | null; email: string }) {
  const id = useId();
  const [state, action, pending] = useActionState(updateProfileAction, idleState);
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const values = state.status === "error" ? state.values : undefined;
  return (
    <form action={action} noValidate className="flex max-w-xl flex-col gap-6">
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {state.status === "success" ? <FormMessage tone="success">{state.message}</FormMessage> : null}
      <Field id={`${id}-email`} label="Email" hint="Your sign-in email can't be changed here.">
        <Input id={`${id}-email`} value={email} readOnly disabled aria-describedby={`${id}-email-hint`} />
      </Field>
      <Field id={`${id}-name`} label="Full name" error={errors?.fullName}>
        <Input
          id={`${id}-name`}
          name="fullName"
          autoComplete="name"
          required
          defaultValue={values?.fullName ?? fullName}
          {...describedBy(`${id}-name`, errors?.fullName)}
        />
      </Field>
      <Field id={`${id}-phone`} label="Phone" optional error={errors?.phone} hint="Used only by your advisor to arrange visits.">
        <Input
          id={`${id}-phone`}
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={values?.phone ?? phone ?? ""}
          {...describedBy(`${id}-phone`, errors?.phone, true)}
        />
      </Field>
      <div>
        <Button type="submit" loading={pending}>
          {pending ? "Saving" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const id = useId();
  const [state, action, pending] = useActionState(changePasswordAction, idleState);
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  return (
    <form action={action} noValidate className="flex max-w-xl flex-col gap-6" key={state.status === "success" ? "done" : "form"}>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {state.status === "success" ? <FormMessage tone="success">{state.message}</FormMessage> : null}
      <Field id={`${id}-current`} label="Current password" error={errors?.currentPassword}>
        <Input
          id={`${id}-current`}
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          {...describedBy(`${id}-current`, errors?.currentPassword)}
        />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={`${id}-new`} label="New password" error={errors?.password}>
          <Input id={`${id}-new`} name="password" type="password" autoComplete="new-password" required {...describedBy(`${id}-new`, errors?.password)} />
        </Field>
        <Field id={`${id}-confirm`} label="Confirm new password" error={errors?.confirmPassword}>
          <Input
            id={`${id}-confirm`}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            {...describedBy(`${id}-confirm`, errors?.confirmPassword)}
          />
        </Field>
      </div>
      <p className="-mt-2 text-[0.8125rem] text-muted">At least 8 characters, with a letter and a number.</p>
      <div>
        <Button type="submit" variant="outline" loading={pending}>
          {pending ? "Updating" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
