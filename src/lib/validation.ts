import { z } from "zod";
import { AMENITY_BY_SLUG, VISIT_TIME_SLOTS } from "./constants";
import { addDays, todayInIndia } from "./format";
import { CITY_SLUGS, INQUIRY_TOPICS, PROPERTY_STATUSES, PROPERTY_TYPES, VISIT_STATUSES } from "./types";

// ── Primitives ──────────────────────────────────────────────────────────────

export const emailSchema = z
  .string({ error: "Enter your email address." })
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address.")
  .max(254, "That email address is too long.")
  .pipe(z.email({ error: "Enter a valid email address." }));

export const passwordSchema = z
  .string({ error: "Enter a password." })
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.");

export const nameSchema = z
  .string({ error: "Enter your name." })
  .trim()
  .min(2, "Enter your full name.")
  .max(100, "Use 100 characters or fewer.");

export const phoneSchema = z
  .string({ error: "Enter a phone number." })
  .trim()
  .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number.")
  .refine((v) => {
    const digits = v.replace(/\D/g, "").length;
    return digits >= 10 && digits <= 15;
  }, "Enter a valid phone number, including area code.");

const optionalPhone = z
  .string()
  .trim()
  .max(20)
  .transform((v) => v || null)
  .pipe(phoneSchema.nullable());

/** Hidden field that should stay empty; bots tend to fill every input. */
const honeypot = z.string().max(0, "Unexpected input.").optional().default("");

// ── Authentication ──────────────────────────────────────────────────────────

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(72),
});

export const signUpSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().max(200).optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(72),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const profileSchema = z.object({
  fullName: nameSchema,
  phone: optionalPhone,
});

// ── Visit requests ──────────────────────────────────────────────────────────

export const MAX_VISIT_DAYS_AHEAD = 90;

export function visitRequestSchema(today: string = todayInIndia()) {
  const latest = addDays(today, MAX_VISIT_DAYS_AHEAD);
  return z.object({
    propertyId: z.uuid({ error: "Unknown property." }),
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    preferredDate: z.iso
      .date({ error: "Choose a date." })
      .refine((d) => d >= today, "Choose today or a future date.")
      .refine((d) => d <= latest, `Choose a date within the next ${MAX_VISIT_DAYS_AHEAD} days.`),
    preferredTime: z.enum(VISIT_TIME_SLOTS as [string, ...string[]], { error: "Choose a time." }),
    message: z.string().trim().max(1000, "Use 1,000 characters or fewer.").optional().default(""),
    website: honeypot,
  });
}

// ── Inquiries ───────────────────────────────────────────────────────────────

export const inquirySchema = z.object({
  topic: z.enum(INQUIRY_TOPICS).default("general"),
  name: nameSchema,
  email: emailSchema,
  phone: optionalPhone,
  message: z
    .string({ error: "Tell us a little about what you're looking for." })
    .trim()
    .min(10, "Tell us a little more (at least 10 characters).")
    .max(2000, "Use 2,000 characters or fewer."),
  city: z.enum(CITY_SLUGS).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  expectedPrice: z.string().trim().max(40).optional(),
  website: honeypot,
}).superRefine((v, ctx) => {
  // Listing enquiries need to say where and what the property is.
  if (v.topic !== "listing") return;
  if (!v.city) ctx.addIssue({ code: "custom", path: ["city"], message: "Choose a city." });
  if (!v.propertyType) ctx.addIssue({ code: "custom", path: ["propertyType"], message: "Choose a property type." });
});

// ── Admin: properties ───────────────────────────────────────────────────────

const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (url) => /^https:\/\/[^\s]+$/.test(url) || /^\/(api\/uploads|floorplans)\/[\w./-]+$/.test(url),
    "Use an uploaded image or an https:// URL.",
  );

export const propertySchema = z.object({
  name: z.string().trim().min(2, "Enter a name.").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Enter a slug.")
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens."),
  tagline: z.string().trim().max(160).default(""),
  description: z.string().trim().min(40, "Write at least a short paragraph (40+ characters).").max(6000),
  price: z.coerce
    .number({ error: "Enter a price." })
    .int("Use a whole number of rupees.")
    .min(100_000, "Price must be at least ₹1 L.")
    .max(10_000_000_000, "Price looks too high."),
  city: z.enum(CITY_SLUGS, { error: "Choose a city." }),
  locality: z.string().trim().min(2, "Enter the locality.").max(80),
  address: z.string().trim().max(200).default(""),
  latitude: z.coerce.number({ error: "Enter a latitude." }).min(6, "Latitude must be within India.").max(37.5, "Latitude must be within India."),
  longitude: z.coerce.number({ error: "Enter a longitude." }).min(68, "Longitude must be within India.").max(97.5, "Longitude must be within India."),
  type: z.enum(PROPERTY_TYPES, { error: "Choose a property type." }),
  bedrooms: z.coerce.number().int().min(0).max(50),
  bathrooms: z.coerce.number().int().min(0).max(50),
  areaSqft: z.coerce.number().int().min(100, "Area must be at least 100 sq.ft.").max(500_000),
  yearBuilt: z.coerce
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear() + 5)
    .nullable()
    .default(null),
  parking: z.coerce.number().int().min(0).max(50),
  amenities: z
    .array(z.string())
    .max(40)
    .transform((list) => [...new Set(list)])
    .refine((list) => list.every((a) => a in AMENITY_BY_SLUG), "Unknown amenity."),
  status: z.enum(PROPERTY_STATUSES),
  featured: z.boolean(),
  agentId: z.uuid().nullable(),
  images: z
    .array(z.object({ url: imageUrl, alt: z.string().trim().min(3, "Describe each image (alt text).").max(200) }))
    .min(1, "Add at least one photograph.")
    .max(24, "Use 24 photographs or fewer."),
  floorPlans: z
    .array(z.object({ url: imageUrl, label: z.string().trim().min(1, "Label each floor plan.").max(60) }))
    .max(6, "Use 6 floor plans or fewer."),
});

export type PropertyFormValues = z.input<typeof propertySchema>;

export const propertyStatusSchema = z.enum(PROPERTY_STATUSES);
export const visitStatusSchema = z.enum(VISIT_STATUSES);
export const uuidSchema = z.uuid();

// ── Helpers ─────────────────────────────────────────────────────────────────

export type FieldErrors = Record<string, string[] | undefined>;

export type FormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: FieldErrors; values?: Record<string, string> }
  | { status: "success"; message?: string; data?: Record<string, string> };

export const idleState: FormState = { status: "idle" };

export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Read string values from FormData (files and missing keys become ""). */
export function formValues(formData: FormData, keys: string[]): Record<string, string> {
  return Object.fromEntries(
    keys.map((k) => {
      const v = formData.get(k);
      return [k, typeof v === "string" ? v : ""];
    }),
  );
}
