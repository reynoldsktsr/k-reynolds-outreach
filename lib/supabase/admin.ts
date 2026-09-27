import { createClient } from "@supabase/supabase-js";

// Server-only client using the service_role key, which bypasses RLS
// entirely. Never import this from a client component or expose the key
// to the browser - it has full read/write access to every table.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
}
