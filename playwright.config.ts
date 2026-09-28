import { defineConfig, devices } from "@playwright/test";

// Only set this if your environment provides its own pre-installed Chromium
// at a fixed path instead of the one Playwright would normally download
// (e.g. a sandboxed CI image) - leave unset everywhere else.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

const PORT = process.env.PORT ?? "3000";
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
// Only spin up a local dev server when testing against localhost - if
// E2E_BASE_URL points at a deployed environment, hit that instead.
const usingLocalServer = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL,
    storageState: "./e2e/.state/storage-state.json",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
  webServer: usingLocalServer
    ? {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: { E2E_TEST_MODE: "1" },
      }
    : undefined,
});
