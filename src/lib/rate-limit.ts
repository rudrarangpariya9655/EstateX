import "server-only";
import { headers } from "next/headers";

/**
 * Small fixed-window rate limiter for form submissions and auth attempts.
 * In-memory per server instance — adequate as a first line of defence; use a
 * shared store (e.g. Redis/Upstash) when running many instances.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  return { ok: true, retryAfterSeconds: 0 };
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Convenience: rate limit an action by client IP. */
export async function limitByIp(action: string, limit: number, windowMs: number) {
  return rateLimit(`${action}:${await clientIp()}`, limit, windowMs);
}
