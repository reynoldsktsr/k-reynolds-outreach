// Interim auth: a single shared password gates the whole app. Swap for
// real Supabase auth later by replacing isValidSession's implementation
// (check a Supabase session cookie/JWT instead) - everything else that
// calls it (middleware, login route) stays the same.
export const SESSION_COOKIE_NAME = "outreach_session";

export function isValidSession(token: string | undefined | null): boolean {
  const password = process.env.OUTREACH_PASSWORD;
  return !!password && token === password;
}
