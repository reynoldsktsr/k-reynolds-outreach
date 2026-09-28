import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { getTestBusiness } from "./test-data";

test("adding a business manually from the dashboard", async ({ page }) => {
  await page.goto("/businesses");
  await page.getByRole("button", { name: "Add business" }).click();
  await expect(page.getByRole("dialog", { name: "Add a business" })).toBeVisible();

  const name = `E2E Manual Add ${Date.now()}`;
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Add business", exact: true }).last().click();

  // Redirects straight to the new business's detail page.
  await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 10_000 });
  const businessId = new URL(page.url()).pathname.split("/").pop();

  await page.goto("/businesses");
  await page.getByPlaceholder("Search businesses...").fill(name);
  await expect(page.getByRole("link", { name })).toBeVisible();

  // This test creates a real row (unlike everything else here, which
  // operates on the one seeded-and-torn-down test business) - clean it up
  // directly rather than leaving it for a periodic manual sweep.
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
  await supabase.from("businesses").delete().eq("id", businessId);
});

test("marking a business as replied logs it and updates status", async ({ page }) => {
  const { businessId } = getTestBusiness();
  await page.goto(`/businesses/${businessId}`);

  await page.getByLabel("Status").selectOption("contacted");
  await expect(page.getByText('Status updated to "contacted".')).toBeVisible();

  await page.getByRole("button", { name: "Mark as replied" }).click();
  await page.getByPlaceholder("What did they say? (optional)").fill("Interested, wants a quote.");
  await page.getByRole("button", { name: "Save reply" }).click();

  await expect(page.getByText("Marked as replied.")).toBeVisible();
  await expect(page.getByText(/Replied/)).toBeVisible();
  await expect(page.getByText("Interested, wants a quote.")).toBeVisible();
});

test("bulk-selecting businesses shows the bulk action bar", async ({ page }) => {
  const { businessName } = getTestBusiness();
  await page.goto("/businesses");
  await page.getByPlaceholder("Search businesses...").fill(businessName);

  const row = page.locator("tbody tr").filter({ hasText: businessName });
  await row.getByRole("checkbox", { name: "Select row" }).check();

  await expect(page.getByText("1 selected")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark not interested" })).toBeVisible();
});

test("CSV export button is present and triggers a download", async ({ page }) => {
  await page.goto("/businesses");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^businesses-\d{4}-\d{2}-\d{2}\.csv$/);
});

test("command palette opens via the topbar button and navigates", async ({ page }) => {
  await page.goto("/businesses");
  await page.getByRole("button", { name: /Jump to|Open command palette/ }).click();
  await page.getByPlaceholder("Jump to a page or a business...").fill("review queue");
  await page.getByText("Go to Review queue").click();
  await expect(page).toHaveURL("/queue");
});
