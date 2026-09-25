import { NextResponse, type NextRequest } from "next/server";
import { isValidSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (isValidSession(token)) return NextResponse.next();

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!login|api/session|api/admin|_next|favicon.ico).*)"],
};
