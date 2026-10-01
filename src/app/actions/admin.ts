"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { DataError, getStore } from "@/lib/data";
import type { SessionUser } from "@/lib/types";
import {
  fieldErrorsOf,
  propertySchema,
  propertyStatusSchema,
  uuidSchema,
  visitStatusSchema,
  type FormState,
} from "@/lib/validation";
import { USER_ROLES } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  message: string;
}

/** Server-side admin gate for mutations. Never trust the client's view of the role. */
async function adminOrNull(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

const FORBIDDEN: ActionResult = { ok: false, message: "You don't have permission to do that." };

/** Catalogue pages are statically cached; refresh everything that lists properties. */
function revalidateCatalogue() {
  revalidatePath("/", "layout");
}

function failure(error: unknown, fallback: string): ActionResult {
  if (error instanceof DataError) return { ok: false, message: error.message };
  console.error("[admin]", error);
  return { ok: false, message: fallback };
}

// ── Properties ───────────────────────────────────────────────────────────────

/**
 * Create or update a property. The client sends the form as a JSON payload;
 * it is re-validated here with the same schema, so client checks are only a
 * convenience.
 */
export async function savePropertyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await adminOrNull())) return { status: "error", message: FORBIDDEN.message };

  const rawId = formData.get("id");
  const id = typeof rawId === "string" && rawId ? rawId : null;
  if (id && !uuidSchema.safeParse(id).success) return { status: "error", message: "Unknown property." };

  let payload: unknown;
  try {
    const raw = formData.get("payload");
    if (typeof raw !== "string" || raw.length > 200_000) throw new Error("bad payload");
    payload = JSON.parse(raw);
  } catch {
    return { status: "error", message: "The form could not be read. Please try again." };
  }

  const parsed = propertySchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const store = getStore();
  try {
    if (!(await store.isSlugAvailable(parsed.data.slug, id ?? undefined))) {
      return { status: "error", message: "That slug is already in use.", fieldErrors: { slug: ["Another property already uses this slug."] } };
    }
    if (parsed.data.agentId) {
      const agents = await store.listAgents();
      if (!agents.some((a) => a.id === parsed.data.agentId)) {
        return { status: "error", message: "Please check the highlighted fields.", fieldErrors: { agentId: ["Unknown advisor."] } };
      }
    }
    const saved = id ? await store.updateProperty(id, parsed.data) : await store.createProperty(parsed.data);
    revalidateCatalogue();
    return {
      status: "success",
      message: id ? `${saved.name} has been updated.` : `${saved.name} has been created.`,
      data: { id: saved.id, slug: saved.slug },
    };
  } catch (error) {
    if (error instanceof DataError && error.code === "conflict") {
      return { status: "error", message: error.message, fieldErrors: { slug: [error.message] } };
    }
    const result = failure(error, "The property could not be saved. Please try again.");
    return { status: "error", message: result.message };
  }
}

export async function deletePropertyAction(id: string): Promise<ActionResult> {
  if (!(await adminOrNull())) return FORBIDDEN;
  if (!uuidSchema.safeParse(id).success) return { ok: false, message: "Unknown property." };
  try {
    await getStore().deleteProperty(id);
    revalidateCatalogue();
    return { ok: true, message: "The property has been deleted." };
  } catch (error) {
    return failure(error, "The property could not be deleted.");
  }
}

export async function setPropertyStatusAction(id: string, status: string): Promise<ActionResult> {
  if (!(await adminOrNull())) return FORBIDDEN;
  const parsedStatus = propertyStatusSchema.safeParse(status);
  if (!uuidSchema.safeParse(id).success || !parsedStatus.success) return { ok: false, message: "Invalid request." };
  try {
    await getStore().setPropertyStatus(id, parsedStatus.data);
    revalidateCatalogue();
    return { ok: true, message: "Status updated." };
  } catch (error) {
    return failure(error, "The status could not be updated.");
  }
}

export async function setPropertyFeaturedAction(id: string, featured: boolean): Promise<ActionResult> {
  if (!(await adminOrNull())) return FORBIDDEN;
  if (!uuidSchema.safeParse(id).success || typeof featured !== "boolean") return { ok: false, message: "Invalid request." };
  try {
    await getStore().setPropertyFeatured(id, featured);
    revalidateCatalogue();
    return { ok: true, message: featured ? "Added to featured residences." : "Removed from featured residences." };
  } catch (error) {
    return failure(error, "The property could not be updated.");
  }
}

// ── Visit requests ───────────────────────────────────────────────────────────

export async function setVisitStatusAction(id: string, status: string): Promise<ActionResult> {
  if (!(await adminOrNull())) return FORBIDDEN;
  const parsedStatus = visitStatusSchema.safeParse(status);
  if (!uuidSchema.safeParse(id).success || !parsedStatus.success) return { ok: false, message: "Invalid request." };
  try {
    await getStore().updateVisitStatus(id, parsedStatus.data);
    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Visit request updated." };
  } catch (error) {
    return failure(error, "The visit request could not be updated.");
  }
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function setUserRoleAction(userId: string, role: string): Promise<ActionResult> {
  const admin = await adminOrNull();
  if (!admin) return FORBIDDEN;
  if (!uuidSchema.safeParse(userId).success || !(USER_ROLES as readonly string[]).includes(role)) {
    return { ok: false, message: "Invalid request." };
  }
  if (userId === admin.id) return { ok: false, message: "You can't change your own role." };
  try {
    await getStore().setUserRole(userId, role as (typeof USER_ROLES)[number]);
    revalidatePath("/admin/users");
    return { ok: true, message: role === "admin" ? "Administrator access granted." : "Administrator access removed." };
  } catch (error) {
    return failure(error, "The role could not be updated.");
  }
}
