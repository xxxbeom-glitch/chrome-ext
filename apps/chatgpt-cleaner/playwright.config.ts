import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const extensionPath = resolve(import.meta.dirname, ".output/chrome-mv3");

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-extension",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  metadata: {
    extensionPath,
  },
});
