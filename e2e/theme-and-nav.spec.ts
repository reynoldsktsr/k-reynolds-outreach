import { test, expect } from "@playwright/test";

test("dark mode toggle switches themes and persists across reload", async ({ page }) => {
  await page.goto("/businesses");
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);

  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(html).toHaveClass(/dark/);

  await page.reload();
  await expect(html).toHaveClass(/dark/);

  // Reset back to light so other tests in the suite see a consistent state.
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(html).not.toHaveClass(/dark/);
});

test("sidebar navigation links work and highlight the active route", async ({ page }) => {
  await page.goto("/businesses");
  await page.getByRole("link", { name: "Review queue" }).click();
  await expect(page).toHaveURL("/queue");
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL("/settings");
  await page.getByRole("link", { name: "Businesses" }).click();
  await expect(page).toHaveURL("/businesses");
});

test("sign out returns to the login page", async ({ page }) => {
  await page.goto("/businesses");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
});
