"use server";

import { revalidatePath } from "next/cache";
import { getAuth, getCurrentUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { limitByIp } from "@/lib/rate-limit";
import { changePasswordSchema, fieldErrorsOf, formValues, profileSchema, type FormState } from "@/lib/validation";

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Your session has ended. Please sign in again." };
  const values = formValues(formData, ["fullName", "phone"]);
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  try {
    await getStore().updateProfile(user.id, parsed.data);
    revalidatePath("/dashboard", "layout");
    return { status: "success", message: "Your profile has been updated." };
  } catch (error) {
    console.error("[account] profile update failed", error);
    return { status: "error", message: "We couldn't save your profile. Please try again.", values };
  }
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Your session has ended. Please sign in again." };
  const limit = await limitByIp("change-password", 5, 15 * 60_000);
  if (!limit.ok) return { status: "error", message: "Too many attempts. Please wait a few minutes and try again." };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const result = await getAuth().changePassword(user, parsed.data.currentPassword, parsed.data.password);
  if (!result.ok) {
    return { status: "error", message: result.error, fieldErrors: result.field ? { [result.field]: [result.error] } : undefined };
  }
  return { status: "success", message: result.message ?? "Your password has been changed." };
}
