import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens, OAUTH_STATE_COOKIE } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const state = req.nextUrl.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (error) {
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(error)}`, req.url));
  }
  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/settings?error=invalid_oauth_state", req.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=missing_code", req.url));
  }

  try {
    const email = await exchangeCodeForTokens(code);
    return NextResponse.redirect(new URL(`/settings?connected=${encodeURIComponent(email ?? "")}`, req.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(message)}`, req.url));
  }
}
