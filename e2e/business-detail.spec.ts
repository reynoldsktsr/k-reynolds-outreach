import { test, expect, type Page } from "@playwright/test";
import { getTestBusiness } from "./test-data";

// Serial: each step builds on the last (add a contact before sending needs
// it, generate a draft before editing/sending it needs one to exist).
test.describe.serial("business detail page", () => {
  let page: Page;
  let businessId: string;
  let businessName: string;

  test.beforeAll(async ({ browser }) => {
    ({ businessId, businessName } = getTestBusiness());
    page = await browser.newPage({ storageState: "./e2e/.state/storage-state.json" });
    await page.goto(`/businesses/${businessId}`);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("loads the business and shows its name", async () => {
    await expect(page.getByRole("heading", { name: businessName })).toBeVisible();
  });

  test("editing details saves and shows a success toast", async () => {
    await page.getByText("Edit details").click();
    const gapField = page.getByLabel("Gap summary");
    await gapField.fill("Updated by the e2e suite.");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Business details saved.")).toBeVisible();
    // The updated text legitimately appears twice once saved - the page's
    // own gap-summary blurb, and the still-open edit form's textarea still
    // showing the same value - so check the specific field, not the page.
    await expect(gapField).toHaveValue("Updated by the e2e suite.");
  });

  test("updating status shows a success toast", async () => {
    await page.getByLabel("Status").selectOption("drafted");
    await expect(page.getByText('Status updated to "drafted".')).toBeVisible();
  });

  test("running the domain check returns candidate domains", async () => {
    await page.getByRole("button", { name: "Suggest & check domains" }).click();
    await expect(page.getByText(/available|taken|unknown/).first()).toBeVisible({ timeout: 15_000 });
  });

  test("running analysis adds a report", async () => {
    await page.getByRole("button", { name: /Run stack analysis|Generate pitch report/ }).click();
    await expect(page.getByText("Analysis complete.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/\[test mode\] Simulated/)).toBeVisible();
  });

  test("adding a contact through the modal", async () => {
    await page.getByRole("button", { name: "Add contact" }).click();
    const dialog = page.getByRole("dialog", { name: "Add contact" });
    await expect(dialog).toBeVisible();
    // Scoped to the dialog - the business's own "Edit details" form (open
    // from an earlier test) also has a field labeled "Name".
    await dialog.getByLabel("Name").fill("E2E Test Contact");
    await dialog.getByLabel("Email", { exact: true }).fill("e2e-contact@example.com");
    await dialog.getByRole("button", { name: "Save contact" }).click();
    await expect(page.getByText("Contact added.")).toBeVisible();
    // The new contact's name also appears as an <option> in the "write one
    // manually" contact-select dropdown further down the page, so scope to
    // the Contacts list item specifically rather than a bare text match.
    const contactItem = page.getByRole("listitem").filter({ hasText: "E2E Test Contact" });
    await expect(contactItem).toBeVisible();
    await expect(contactItem).toContainText("e2e-contact@example.com");
  });

  test("generating a pitch email adds a pending draft", async () => {
    await page.getByRole("button", { name: "Generate pitch email" }).click();
    await expect(page.getByText("Pitch email drafted.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Pending drafts" })).toBeVisible();
  });

  test("editing a pending draft's subject and saving", async () => {
    const draftCard = page.getByRole("heading", { name: "Pending drafts" }).locator("..").locator("li").first();
    const subjectInput = draftCard.locator('input[type="text"], input:not([type])').first();
    await subjectInput.fill("[edited by e2e] Quick note");
    await draftCard.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Draft saved.")).toBeVisible();
  });

  test("approving and sending the draft removes it from pending", async () => {
    const draftCard = page.getByRole("heading", { name: "Pending drafts" }).locator("..").locator("li").first();
    await draftCard.getByRole("button", { name: "Approve & send" }).click();
    await expect(page.getByText("Email sent.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Pending drafts" })).not.toBeVisible();
    // Shows up twice in History once sent - its own entry, and the
    // communications log line - either confirms the send went through.
    await expect(page.getByText("[edited by e2e] Quick note").first()).toBeVisible();
  });

  test("writing and discarding a manual draft", async () => {
    await page.getByText("Or write one manually").click();
    await page.getByPlaceholder("Subject").fill("Manual e2e draft");
    await page.locator(".ProseMirror").fill("This is a manually written test draft.");
    await page.getByRole("button", { name: "Save to review queue" }).click();
    await expect(page.getByText("Draft saved to review queue.")).toBeVisible();

    const draftCard = page.getByRole("heading", { name: "Pending drafts" }).locator("..").locator("li").first();
    page.once("dialog", (dialog) => dialog.accept());
    await draftCard.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText("Draft discarded.")).toBeVisible();
    await expect(page.getByText("Manual e2e draft")).toBeVisible(); // now in History, not Pending
  });
});
