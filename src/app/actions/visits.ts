"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { DataError, getStore } from "@/lib/data";
import { formatDate, formatTimeSlot } from "@/lib/format";
import { limitByIp } from "@/lib/rate-limit";
import { fieldErrorsOf, formValues, uuidSchema, visitRequestSchema, type FormState } from "@/lib/validation";

const FIELDS = ["propertyId", "name", "email", "phone", "preferredDate", "preferredTime", "message"];

/** Submit a visit request. It is stored as "pending" — nothing is confirmed until an advisor does so. */
export async function requestVisitAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, FIELDS);
  const limit = await limitByIp("visit-request", 5, 10 * 60_000);
  if (!limit.ok) {
    return { status: "error", message: "You've sent several requests in a short time. Please try again shortly.", values };
  }

  const parsed = visitRequestSchema().safeParse({ ...values, website: formData.get("website") ?? "" });
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error), values };
  }

  try {
    const user = await getCurrentUser();
    const { website: _honeypot, ...input } = parsed.data;
    const visit = await getStore().createVisitRequest({ ...input, userId: user?.id ?? null });
    revalidatePath("/dashboard/visits");
    revalidatePath("/admin/visits");
    return {
      status: "success",
      data: {
        reference: visit.reference,
        date: formatDate(visit.preferredDate, { weekday: "long", day: "numeric", month: "long" }),
        time: formatTimeSlot(visit.preferredTime),
        email: visit.email,
      },
    };
  } catch (error) {
    if (error instanceof DataError) return { status: "error", message: error.message, values };
    console.error("[visits] create failed", error);
    return { status: "error", message: "We couldn't send your request. Please try again.", values };
  }
}

export async function cancelVisitAction(visitId: string): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };
  if (!uuidSchema.safeParse(visitId).success) return { ok: false, message: "Unknown request." };
  try {
    const ok = await getStore().cancelVisitRequest(user.id, visitId);
    revalidatePath("/dashboard/visits");
    revalidatePath("/dashboard");
    revalidatePath("/admin/visits");
    return ok
      ? { ok: true, message: "Your visit request has been cancelled." }
      : { ok: false, message: "This request can no longer be cancelled." };
  } catch (error) {
    console.error("[visits] cancel failed", error);
    return { ok: false, message: "We couldn't cancel the request. Please try again." };
  }
}
