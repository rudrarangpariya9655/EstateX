import { getCurrentUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { errorResponse, json } from "@/lib/api";

/** Current visitor's session summary and saved property ids (never cached). */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ user: null, favorites: [] });
    const favorites = await getStore().listFavoriteIds(user.id);
    return json({
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      favorites,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
