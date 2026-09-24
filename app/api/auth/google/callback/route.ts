import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(error)}`, req.url));
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
