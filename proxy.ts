import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const CANONICAL_HOST = "outreach.k-reynolds.com";

export async function proxy(req: NextRequest) {
  // Netlify's per-deploy permalink (and the default *.netlify.app domain)
  // serve the same app on a different hostname, which doesn't carry the
  // session cookie set on the real domain - always bounce back to it first,
  // before the auth check even runs, so this never looks like a login bug.
  if (req.nextUrl.hostname !== CANONICAL_HOST && req.nextUrl.hostname !== "localhost") {
    const canonicalUrl = new URL(req.nextUrl.pathname + req.nextUrl.search, `https://${CANONICAL_HOST}`);
    return NextResponse.redirect(canonicalUrl);
  }

  const { response, user } = await updateSession(req);
  if (user) return response;

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!login|_next|favicon.ico).*)"],
};
