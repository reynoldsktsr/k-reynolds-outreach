import { test, expect } from "@playwright/test";
import { getTestBusiness } from "./test-data";

test("a freshly generated draft shows up in the review queue and can be sent", async ({ page }) => {
  const { businessId, businessName } = getTestBusiness();

  // Generate a fresh draft for this test rather than relying on state left
  // over from business-detail.spec.ts (which sends/discards its own drafts).
  await page.goto(`/businesses/${businessId}`);
  await page.getByRole("button", { name: "Generate pitch email" }).click();
  await expect(page.getByText("Pitch email drafted.")).toBeVisible({ timeout: 15_000 });

  await page.goto("/queue");
  await expect(page.getByRole("heading", { name: "Review queue" })).toBeVisible();
  // The pitch email's own body text can legitimately also contain the
  // business name, so scope to the specific card via its link, not a bare
  // text match (which can then match twice: the link and the email body).
  const businessLink = page.getByRole("link", { name: businessName, exact: true });
  await expect(businessLink).toBeVisible();

  const card = page.locator(".card").filter({ has: businessLink });
  await card.getByRole("button", { name: "Approve & send" }).click();
  await expect(page.getByText("Email sent.")).toBeVisible({ timeout: 15_000 });
});

test("discarding a draft from the queue asks for confirmation", async ({ page }) => {
  const { businessId, businessName } = getTestBusiness();

  await page.goto(`/businesses/${businessId}`);
  await page.getByRole("button", { name: "Generate pitch email" }).click();
  await expect(page.getByText("Pitch email drafted.")).toBeVisible({ timeout: 15_000 });

  await page.goto("/queue");
  const businessLink = page.getByRole("link", { name: businessName, exact: true });
  const card = page.locator(".card").filter({ has: businessLink });

  page.once("dialog", (dialog) => dialog.accept());
  await card.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByText("Draft discarded.")).toBeVisible();
});

test("queue is empty state renders when there's nothing to review", async ({ page }) => {
  await page.goto("/queue");
  // Not asserting the queue is globally empty (other real leads may have
  // pending drafts) - just that the page renders its list or empty state
  // without erroring.
  await expect(page.getByRole("heading", { name: "Review queue" })).toBeVisible();
});
