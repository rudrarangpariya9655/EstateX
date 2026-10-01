"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useId, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  forgotPasswordAction,
  resetPasswordAction,
  signInAction,
  signUpAction,
} from "@/app/actions/auth";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, describedBy, inputClasses } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { idleState, type FormState } from "@/lib/validation";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/**
 * Wraps an auth server action so that, on success, the client session is
 * refreshed before navigating — the header and favorites update immediately.
 */
function useAuthAction(action: Action) {
  const router = useRouter();
  const { refresh } = useSession();
  return useActionState(async (prev: FormState, formData: FormData) => {
    const result = await action(prev, formData);
    const redirectTo = result.status === "success" ? result.data?.redirectTo : undefined;
    if (redirectTo) {
      await refresh();
      router.replace(redirectTo);
      router.refresh();
    }
    return result;
  }, idleState);
}

function PasswordInput({ id, className, ...props }: ComponentProps<"input"> & { id: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        className={cn(inputClasses, "pr-14", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-controls={id}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-muted transition-colors hover:text-ink"
      >
        {visible ? <EyeOff aria-hidden className="size-4" strokeWidth={1.5} /> : <Eye aria-hidden className="size-4" strokeWidth={1.5} />}
      </button>
    </div>
  );
}

export function AuthHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="mb-10">
      <p className="hero-fade eyebrow text-muted">{eyebrow}</p>
      <h1 className="hero-fade mt-5 text-h2" style={{ animationDelay: "80ms" }}>
        {title}
      </h1>
      {body ? (
        <p className="hero-fade mt-5 text-[0.9375rem] leading-relaxed text-muted" style={{ animationDelay: "160ms" }}>
          {body}
        </p>
      ) : null}
    </div>
  );
}

function errorsOf(state: FormState) {
  return state.status === "error" ? state.fieldErrors : undefined;
}

function valuesOf(state: FormState) {
  return state.status === "error" ? state.values : undefined;
}

export function SignInForm({ next, notice }: { next: string; notice?: { tone: "success" | "error" | "info"; text: string } }) {
  const id = useId();
  const [state, action, pending] = useAuthAction(signInAction);
  const errors = errorsOf(state);
  const values = valuesOf(state);

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {notice && state.status === "idle" ? <FormMessage tone={notice.tone}>{notice.text}</FormMessage> : null}
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      <input type="hidden" name="next" value={next} />
      <Field id={`${id}-email`} label="Email" error={errors?.email}>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={values?.email}
          {...describedBy(`${id}-email`, errors?.email)}
        />
      </Field>
      <Field
        id={`${id}-password`}
        label="Password"
        error={errors?.password}
      >
        <PasswordInput
          id={`${id}-password`}
          name="password"
          autoComplete="current-password"
          required
          {...describedBy(`${id}-password`, errors?.password)}
        />
      </Field>
      <div className="-mt-2 flex justify-end">
        <Link href="/forgot-password" className="text-[0.8125rem] text-muted underline-offset-4 hover:text-ink hover:underline">
          Forgot your password?
        </Link>
      </div>
      <Button type="submit" loading={pending} className="w-full">
        {pending ? "Signing in" : "Sign in"}
      </Button>
      <p className="text-[0.875rem] text-muted">
        New to EstateX?{" "}
        <Link href={`/sign-up${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-ink underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm({ next }: { next: string }) {
  const id = useId();
  const [state, action, pending] = useAuthAction(signUpAction);
  const errors = errorsOf(state);
  const values = valuesOf(state);

  if (state.status === "success" && state.message) {
    return (
      <div role="status" className="border-t-2 border-accent bg-surface p-8">
        <p className="eyebrow text-accent">Check your inbox</p>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-soft">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      <input type="hidden" name="next" value={next} />
      <Field id={`${id}-name`} label="Full name" error={errors?.fullName}>
        <Input
          id={`${id}-name`}
          name="fullName"
          autoComplete="name"
          required
          defaultValue={values?.fullName}
          {...describedBy(`${id}-name`, errors?.fullName)}
        />
      </Field>
      <Field id={`${id}-email`} label="Email" error={errors?.email}>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={values?.email}
          {...describedBy(`${id}-email`, errors?.email)}
        />
      </Field>
      <Field id={`${id}-password`} label="Password" error={errors?.password} hint="At least 8 characters, with a letter and a number.">
        <PasswordInput
          id={`${id}-password`}
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          {...describedBy(`${id}-password`, errors?.password, true)}
        />
      </Field>
      <Button type="submit" loading={pending} className="w-full">
        {pending ? "Creating account" : "Create account"}
      </Button>
      <p className="text-[0.8125rem] leading-relaxed text-muted">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-ink">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-ink">
          privacy notice
        </Link>
        .
      </p>
      <p className="text-[0.875rem] text-muted">
        Already have an account?{" "}
        <Link href={`/sign-in${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const id = useId();
  const [state, action, pending] = useActionState(forgotPasswordAction, idleState);
  const errors = errorsOf(state);

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-8">
        <div role="status" className="border-t-2 border-accent bg-surface p-8">
          <p className="eyebrow text-accent">Request received</p>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-soft">{state.message}</p>
        </div>
        <Link href="/sign-in" className="text-[0.875rem] text-muted underline underline-offset-4 hover:text-ink">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      <Field id={`${id}-email`} label="Email" error={errors?.email}>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={valuesOf(state)?.email}
          {...describedBy(`${id}-email`, errors?.email)}
        />
      </Field>
      <Button type="submit" loading={pending} className="w-full">
        {pending ? "Sending" : "Send reset link"}
      </Button>
      <Link href="/sign-in" className="text-[0.875rem] text-muted underline-offset-4 hover:text-ink hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token?: string }) {
  const id = useId();
  const [state, action, pending] = useAuthAction(resetPasswordAction);
  const errors = errorsOf(state);

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {state.status === "error" ? (
        <FormMessage tone="error">
          {state.message}{" "}
          {errors?.token || /expired|invalid/i.test(state.message) ? (
            <Link href="/forgot-password" className="underline underline-offset-4">
              Request a new link
            </Link>
          ) : null}
        </FormMessage>
      ) : null}
      {token ? <input type="hidden" name="token" value={token} /> : null}
      <Field id={`${id}-password`} label="New password" error={errors?.password} hint="At least 8 characters, with a letter and a number.">
        <PasswordInput
          id={`${id}-password`}
          name="password"
          autoComplete="new-password"
          required
          {...describedBy(`${id}-password`, errors?.password, true)}
        />
      </Field>
      <Field id={`${id}-confirm`} label="Confirm new password" error={errors?.confirmPassword}>
        <PasswordInput
          id={`${id}-confirm`}
          name="confirmPassword"
          autoComplete="new-password"
          required
          {...describedBy(`${id}-confirm`, errors?.confirmPassword)}
        />
      </Field>
      <Button type="submit" loading={pending} className="w-full">
        {pending ? "Updating" : "Update password"}
      </Button>
    </form>
  );
}

/** One-click sign-in for the demo-mode accounts (only rendered when they are enabled). */
export function DemoAccounts({ accounts, next }: { accounts: { email: string; password: string; label: string }[]; next: string }) {
  const [state, action, pending] = useAuthAction(signInAction);
  return (
    <div className="mt-14 border-t border-line pt-8">
      <p className="eyebrow text-muted">Exploring the demo?</p>
      <p className="mt-3 text-[0.875rem] leading-relaxed text-muted">
        Sign in with a prepared account. Demo data lives on this server only.
      </p>
      {state.status === "error" ? (
        <div className="mt-4">
          <FormMessage tone="error">{state.message}</FormMessage>
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        {accounts.map((account) => (
          <form key={account.email} action={action}>
            <input type="hidden" name="email" value={account.email} />
            <input type="hidden" name="password" value={account.password} />
            <input type="hidden" name="next" value={account.label === "Administrator" ? "/admin" : next} />
            <Button type="submit" variant="outline" size="sm" disabled={pending}>
              {account.label}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
