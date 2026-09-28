import { test, expect } from "@playwright/test";

// This file intentionally runs logged out - the global storageState is
// overridden per-test rather than per-file so a signed-in test can still
// share the file if ever added here.
test.use({ storageState: { cookies: [], origins: [] } });

test("shows an error on invalid credentials and stays on the login page", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("nobody@example.com");
  await page.getByPlaceholder("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText(/invalid|credentials|error/i)).toBeVisible();
});

test("redirects an unauthenticated visitor from a protected page to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});

test("signs in with valid credentials and reaches the dashboard", async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, "no test credentials configured");

  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByPlaceholder("Password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/businesses");
  await expect(page.getByRole("heading", { name: "Businesses" })).toBeVisible();
});
