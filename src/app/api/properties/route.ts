import type { NextRequest } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/data";
import { toSummary } from "@/lib/data/store";
import { errorResponse, json, jsonError } from "@/lib/api";

const idsSchema = z.array(z.uuid()).min(1).max(100);

/** Property summaries by id (used by the Saved page for guests). Order follows the request. */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("ids") ?? "";
  const parsed = idsSchema.safeParse(raw.split(",").filter(Boolean));
  if (!parsed.success) return jsonError("Provide up to 100 property ids.", 400);
  try {
    const properties = await getStore().getPropertiesByIds(parsed.data);
    return json({ properties: properties.map(toSummary) });
  } catch (error) {
    return errorResponse(error);
  }
}
