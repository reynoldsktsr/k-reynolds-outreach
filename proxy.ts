import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(req: NextRequest) {
  const { response, user } = await updateSession(req);
  if (user) return response;

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!login|_next|favicon.ico).*)"],
};
