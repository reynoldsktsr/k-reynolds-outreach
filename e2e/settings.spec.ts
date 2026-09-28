import { test, expect } from "@playwright/test";

test("settings page shows Gmail connection status and a connect link", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("Gmail sending")).toBeVisible();
  await expect(page.getByRole("link", { name: /Connect @k-reynolds\.com|Reconnect/ })).toBeVisible();
});
