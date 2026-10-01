import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "../env";

/**
 * Refreshes the Supabase session cookie on navigation and returns the response
 * plus whether a user is signed in. Route protection here is an optimistic UX
 * redirect only — every protected page, action and API re-verifies the user.
 */
export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // Do not run code between createServerClient and getClaims(): it refreshes the token.
  const { data } = await supabase.auth.getClaims();
  return { response, signedIn: Boolean(data?.claims?.sub) };
}
