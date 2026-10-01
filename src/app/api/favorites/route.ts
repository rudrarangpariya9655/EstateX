import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { errorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({ propertyId: z.uuid(), saved: z.boolean() });

/** Save or unsave a property for the signed-in user. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Cross-site request blocked.", 403);
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Sign in to save homes to your account.", 401);
    if (!rateLimit(`favorites:${user.id}`, 60, 60_000).ok) return jsonError("Too many requests.", 429);
    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError("Invalid request.", 400);
    await getStore().setFavorite(user.id, parsed.data.propertyId, parsed.data.saved);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
