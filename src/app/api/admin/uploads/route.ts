import { getCurrentUser } from "@/lib/auth";
import { errorResponse, isSameOrigin, json, jsonError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_UPLOAD_BYTES, storeImage } from "@/lib/uploads";

/** Admin-only image upload (property photographs and floor plans). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Cross-site request blocked.", 403);
  const user = await getCurrentUser();
  if (!user) return jsonError("Please sign in again.", 401);
  if (user.role !== "admin") return jsonError("Administrator access is required.", 403);
  if (!rateLimit(`upload:${user.id}`, 60, 10 * 60_000).ok) return jsonError("Too many uploads. Please wait a moment.", 429);

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) return jsonError("Images must be 8 MB or smaller.", 413);

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("Choose an image to upload.", 400);
    const url = await storeImage(file);
    return json({ url }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
