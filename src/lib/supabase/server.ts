import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "../env";

/**
 * Per-request client bound to the visitor's auth cookies. Queries run as the
 * signed-in user, so row-level security applies to every read and write.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes sessions, so this is safe to ignore.
        }
      },
    },
  });
}

let publicClient: SupabaseClient | null = null;

/**
 * Cookie-less client for public catalogue reads. Using it keeps public pages
 * statically renderable and cacheable (it never touches request cookies).
 */
export function getSupabasePublicClient(): SupabaseClient {
  publicClient ??= createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return publicClient;
}
