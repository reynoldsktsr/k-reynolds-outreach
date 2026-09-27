import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Session-aware client for staff login (Supabase Auth), using the public
// anon key. This never touches app data directly - lib/db.ts uses the
// service_role admin client for that. This one only answers "who's logged in."
export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component - the proxy already refreshes
            // the session, so a failed write here is safe to ignore.
          }
        },
      },
    },
  );
}
