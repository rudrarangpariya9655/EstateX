import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseEnabled } from "@/lib/env";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

/** Cookie name used by demo-mode sessions (kept in sync with lib/auth/local-auth.ts). */
const LOCAL_SESSION_COOKIE = "estatex_session";
const PROTECTED = ["/dashboard", "/admin"];

/**
 * Refreshes Supabase auth cookies and sends signed-out visitors away from
 * private areas early. This is a UX optimisation only: every protected page,
 * server action and API route re-verifies the user and role on the server.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  let response = NextResponse.next({ request });
  let signedIn: boolean;

  if (isSupabaseEnabled) {
    const result = await updateSupabaseSession(request);
    response = result.response;
    signedIn = result.signedIn;
  } else {
    signedIn = request.cookies.has(LOCAL_SESSION_COOKIE);
  }

  if (isProtected && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (isProtected) response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    // Everything except static assets, image optimisation, uploads and metadata files.
    "/((?!_next/static|_next/image|api/uploads|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|floorplans|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
