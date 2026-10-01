import type { NextRequest } from "next/server";
import { getStore } from "@/lib/data";
import { errorResponse, json } from "@/lib/api";
import { parseSearchState } from "@/lib/search/filters";

/** Number of residences matching a set of filters (live count in the filters drawer). */
export async function GET(request: NextRequest) {
  try {
    const state = parseSearchState(request.nextUrl.searchParams);
    const result = await getStore().searchProperties(state, 1, 1);
    return json({ count: result.total });
  } catch (error) {
    return errorResponse(error);
  }
}
