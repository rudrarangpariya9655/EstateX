import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { errorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/api";

const bodySchema = z.object({ propertyId: z.uuid() });

/** Records a property view for the signed-in user's "Recently viewed" list. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Cross-site request blocked.", 403);
  try {
    const user = await getCurrentUser();
    if (!user) return json({ ok: false, reason: "anonymous" });
    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError("Invalid request.", 400);
    await getStore().recordView(user.id, parsed.data.propertyId);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
