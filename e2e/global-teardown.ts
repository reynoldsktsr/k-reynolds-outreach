import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const STATE_DIR = path.join(__dirname, ".state");
const TEST_DATA_PATH = path.join(STATE_DIR, "test-data.json");

export default async function globalTeardown() {
  if (!existsSync(TEST_DATA_PATH)) return;

  const { businessId } = JSON.parse(readFileSync(TEST_DATA_PATH, "utf-8")) as { businessId: string };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false },
    });
    // Cascades to contacts/drafts/communications/reports for this business.
    await supabase.from("businesses").delete().eq("id", businessId);
  }

  rmSync(STATE_DIR, { recursive: true, force: true });
}
