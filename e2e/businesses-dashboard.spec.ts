import { test, expect } from "@playwright/test";
import { getTestBusiness } from "./test-data";

test("shows stat cards and the businesses table, and search narrows results", async ({ page }) => {
  const { businessName } = getTestBusiness();

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Businesses" })).toBeVisible();

  // Stat cards
  await expect(page.getByText("New leads")).toBeVisible();
  await expect(page.getByText("In progress")).toBeVisible();
  await expect(page.getByText("Won")).toBeVisible();

  // The seeded test business shows up in the table
  await expect(page.getByRole("link", { name: businessName })).toBeVisible();

  // Search narrows the table to just it
  await page.getByPlaceholder("Search businesses...").fill(businessName);
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(businessName);

  // A query matching nothing shows the empty state
  await page.getByPlaceholder("Search businesses...").fill("no-such-business-xyz");
  await expect(page.getByText("No businesses match your search.")).toBeVisible();
});

test("sorting by business name toggles order", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("button", { name: /Business/ });
  await header.click();
  await expect(page.locator("thead").getByText("↑")).toBeVisible();
  await header.click();
  await expect(page.locator("thead").getByText("↓")).toBeVisible();
});

test("clicking a business row navigates to its detail page", async ({ page }) => {
  const { businessName } = getTestBusiness();
  await page.goto("/");
  await page.getByPlaceholder("Search businesses...").fill(businessName);
  await page.getByRole("link", { name: businessName }).click();
  await expect(page.getByRole("heading", { name: businessName })).toBeVisible();
});
