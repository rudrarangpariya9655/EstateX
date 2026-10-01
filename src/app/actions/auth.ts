"use server";

import { getAuth, safeNextPath } from "@/lib/auth";
import { isSupabaseEnabled } from "@/lib/env";
import { limitByIp } from "@/lib/rate-limit";
import {
  fieldErrorsOf,
  forgotPasswordSchema,
  formValues,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  type FormState,
} from "@/lib/validation";

const TOO_MANY = (seconds: number, values?: Record<string, string>): FormState => ({
  status: "error",
  message: `Too many attempts. Please wait ${Math.max(1, Math.ceil(seconds / 60))} minute(s) and try again.`,
  values,
});

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["email", "next"]);
  const limit = await limitByIp("sign-in", 10, 5 * 60_000);
  if (!limit.ok) return TOO_MANY(limit.retryAfterSeconds, values);

  const parsed = signInSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  const result = await getAuth().signIn(parsed.data.email, parsed.data.password);
  if (!result.ok) return { status: "error", message: result.error, values };
  return { status: "success", data: { redirectTo: safeNextPath(values.next) } };
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["fullName", "email", "next"]);
  const limit = await limitByIp("sign-up", 5, 10 * 60_000);
  if (!limit.ok) return TOO_MANY(limit.retryAfterSeconds, values);

  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  const result = await getAuth().signUp(parsed.data);
  if (!result.ok) {
    return {
      status: "error",
      message: result.error,
      fieldErrors: result.field ? { [result.field]: [result.error] } : undefined,
      values,
    };
  }
  if (result.needsConfirmation) {
    return {
      status: "success",
      message: `We've sent a confirmation link to ${parsed.data.email}. Open it to activate your account.`,
    };
  }
  return { status: "success", data: { redirectTo: safeNextPath(values.next) } };
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["email"]);
  const limit = await limitByIp("forgot-password", 5, 15 * 60_000);
  if (!limit.ok) return TOO_MANY(limit.retryAfterSeconds, values);

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", message: "Please enter a valid email address.", fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  await getAuth().requestPasswordReset(parsed.data.email);
  return {
    status: "success",
    message: isSupabaseEnabled
      ? "If an account exists for that email, a reset link is on its way."
      : "If an account exists for that email, a reset link has been created. Demo mode has no email service, so the link is printed in the server console.",
  };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const limit = await limitByIp("reset-password", 10, 15 * 60_000);
  if (!limit.ok) return TOO_MANY(limit.retryAfterSeconds);

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token") || undefined,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const result = await getAuth().resetPassword({ token: parsed.data.token, password: parsed.data.password });
  if (!result.ok) return { status: "error", message: result.error };
  return { status: "success", message: result.message, data: { redirectTo: "/sign-in?reset=1" } };
}

export async function signOutAction(): Promise<void> {
  await getAuth().signOut();
}
