import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { errorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/api";

const bodySchema = z.object({ ids: z.array(z.uuid()).max(100) });

/** Moves homes saved on this device (before signing in) into the user's account. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Cross-site request blocked.", 403);
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Not signed in.", 401);
    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError("Invalid request.", 400);
    const store = getStore();
    await store.addFavorites(user.id, parsed.data.ids);
    return json({ favorites: await store.listFavoriteIds(user.id) });
  } catch (error) {
    return errorResponse(error);
  }
}
