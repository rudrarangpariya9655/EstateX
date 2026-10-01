import type { NextRequest } from "next/server";
import { getStore } from "@/lib/data";
import { errorResponse, json } from "@/lib/api";

/** Quick search used by the header search overlay. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return json({ results: [] });
  try {
    const results = await getStore().quickSearch(q, 6);
    return json({ results }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=300" } });
  } catch (error) {
    return errorResponse(error);
  }
}
