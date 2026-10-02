import "server-only";
import { redirect, unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { isSupabaseEnabled } from "../env";
import type { SessionUser } from "../types";
import { localAuth } from "./local-auth";
import { supabaseAuth } from "./supabase-auth";
import type { AuthService } from "./types";

export function getAuth(): AuthService {
  return isSupabaseEnabled ? supabaseAuth : localAuth;
}

/** The signed-in user for this request (memoised per request). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  try {
    return await getAuth().getUser();
  } catch (error) {
    // Let Next.js control-flow errors (dynamic rendering, redirects) propagate.
    unstable_rethrow(error);
    console.error("[auth] could not resolve session", error);
    return null;
  }
});

/** Only allow same-site relative paths as post-login destinations (prevents open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

export async function requireUser(next = "/dashboard"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(safeNextPath(next))}`);
  return user;
}

/** Server-side admin gate. Never rely on client-side role checks alone. */
export async function requireAdmin(next = "/admin"): Promise<SessionUser> {
  const user = await requireUser(next);
  if (user.role !== "admin") redirect("/dashboard?notice=admin-only");
  return user;
}

export type { AuthResult, AuthService } from "./types";
