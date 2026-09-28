import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUrl, OAUTH_STATE_COOKIE } from "@/lib/gmail";

export async function GET() {
  // Standard OAuth CSRF protection: an attacker who tricks a signed-in user
  // into visiting a callback URL carrying the attacker's own authorization
  // code would otherwise get their Google account linked to our app. Tying
  // the request to a short-lived, httpOnly cookie the callback must match
  // closes that off.
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(getAuthUrl(state));
}
