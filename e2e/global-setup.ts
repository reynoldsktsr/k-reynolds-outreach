import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const STATE_DIR = path.join(__dirname, ".state");
const STORAGE_STATE_PATH = path.join(STATE_DIR, "storage-state.json");
const TEST_DATA_PATH = path.join(STATE_DIR, "test-data.json");

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "E2E_ADMIN_EMAIL",
  "E2E_ADMIN_PASSWORD",
];

export default async function globalSetup(config: FullConfig) {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `e2e tests need these env vars set: ${missing.join(", ")}. ` +
        `NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SECRET_KEY/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are the same ` +
        `values the app itself uses. E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD are a real staff login for the ` +
        `Supabase project under test - never hardcode these, always pass them as env vars.`,
    );
  }

  mkdirSync(STATE_DIR, { recursive: true });

  // Seed one uniquely-named, disposable business so tests never touch real
  // seeded/production leads. global-teardown.ts deletes it (and everything
  // that cascades from it - contacts, drafts, communications, reports) when
  // the run finishes.
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const businessName = `E2E Test Business ${runId}`;

  const { data: business, error } = await supabase
    .from("businesses")
    .insert({
      name: businessName,
      category: "coffee shop",
      city: "Tustin",
      status: "new-lead",
      gap_summary: "Seeded by the e2e test suite. Safe to delete.",
      source_note: "e2e-test",
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to seed e2e test business: ${error.message}`);

  writeFileSync(TEST_DATA_PATH, JSON.stringify({ businessId: business.id, businessName }, null, 2));

  // Log in once and reuse the session across every test file instead of
  // re-authenticating per test.
  const baseURL = config.projects[0]?.use?.baseURL as string;
  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  );
  const page = await browser.newPage({ baseURL });
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByPlaceholder("Password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
  await page.context().storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}
