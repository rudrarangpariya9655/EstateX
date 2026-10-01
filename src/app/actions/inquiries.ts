"use server";

import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/data";
import { CITY_BY_SLUG, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { limitByIp } from "@/lib/rate-limit";
import { fieldErrorsOf, formValues, inquirySchema, type FormState } from "@/lib/validation";

const FIELDS = ["topic", "name", "email", "phone", "message", "city", "propertyType", "expectedPrice"];

/**
 * Stores a contact or "list your property" enquiry. It is saved for the team to
 * follow up — nothing is sent automatically, and the confirmation says so.
 */
export async function submitInquiryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, FIELDS);
  const limit = await limitByIp("inquiry", 5, 10 * 60_000);
  if (!limit.ok) {
    return { status: "error", message: "You've sent several messages in a short time. Please try again shortly.", values };
  }

  const parsed = inquirySchema.safeParse({
    topic: values.topic || undefined,
    name: values.name,
    email: values.email,
    phone: values.phone,
    message: values.message,
    city: values.city || undefined,
    propertyType: values.propertyType || undefined,
    expectedPrice: values.expectedPrice || undefined,
    website: formData.get("website") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error), values };
  }

  const { topic, name, email, phone, message, city, propertyType, expectedPrice } = parsed.data;
  const details: Record<string, string> = {};
  if (city) details.city = CITY_BY_SLUG[city].name;
  if (propertyType) details.propertyType = PROPERTY_TYPE_LABELS[propertyType];
  if (expectedPrice) details.expectedPrice = expectedPrice;

  try {
    await getStore().createInquiry({
      topic,
      name,
      email,
      phone,
      message,
      details: Object.keys(details).length ? details : null,
    });
    revalidatePath("/admin");
    revalidatePath("/admin/inquiries");
    return { status: "success", data: { name: name.split(" ")[0] ?? name, email } };
  } catch (error) {
    console.error("[inquiries] create failed", error);
    return { status: "error", message: "We couldn't send your message. Please try again.", values };
  }
}
