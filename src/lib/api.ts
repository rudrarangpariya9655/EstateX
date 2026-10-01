import "server-only";
import { NextResponse } from "next/server";
import { DataError } from "./data/store";

export const NO_STORE = { "Cache-Control": "private, no-store" } as const;

export function json<T>(data: T, init?: { status?: number; headers?: Record<string, string> }) {
  return NextResponse.json(data, { status: init?.status ?? 200, headers: { ...NO_STORE, ...init?.headers } });
}

export function jsonError(message: string, status: number) {
  return json({ error: message }, { status });
}

/**
 * Reject cross-site state-changing requests. Browsers always send Origin on
 * POST; it must match the host serving the request.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJson(request: Request, maxBytes = 16_384): Promise<unknown> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) throw new DataError("Request body too large.", "invalid");
  const text = await request.text();
  if (text.length > maxBytes) throw new DataError("Request body too large.", "invalid");
  try {
    return JSON.parse(text);
  } catch {
    throw new DataError("Malformed JSON.", "invalid");
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof DataError) {
    const status = { not_found: 404, conflict: 409, forbidden: 403, invalid: 400, unavailable: 503 }[error.code];
    return jsonError(error.message, status);
  }
  console.error("[api]", error);
  return jsonError("Something went wrong. Please try again.", 500);
}
