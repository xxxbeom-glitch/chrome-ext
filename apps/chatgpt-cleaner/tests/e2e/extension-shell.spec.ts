import { test as base, chromium, expect, type BrowserContext } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const extensionPath = resolve(import.meta.dirname, "../../.output/chrome-mv3");

type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
};

const test = base.extend<ExtensionFixtures>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    if (!existsSync(extensionPath)) {
      throw new Error(
        `Missing unpacked extension at ${extensionPath}. Run pnpm build in apps/chatgpt-cleaner first.`,
      );
    }

    const userDataDir = await mkdtemp(resolve(tmpdir(), "chatgpt-cleaner-e2e-"));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let extensionId = "";
    for (const page of context.pages()) {
      if (page.url().startsWith("chrome-extension://")) {
        extensionId = new URL(page.url()).host;
        break;
      }
    }

    if (!extensionId) {
      const serviceWorkers = context.serviceWorkers();
      if (serviceWorkers[0]) {
        extensionId = new URL(serviceWorkers[0].url()).host;
      } else {
        const worker = await context.waitForEvent("serviceworker", { timeout: 15_000 });
        extensionId = new URL(worker.url()).host;
      }
    }

    await use(extensionId);
  },
});

test.describe("Phase 0/1 extension harness", () => {
  test("popup shell renders launcher actions", async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(page.getByRole("heading", { name: "ChatGPT Cleaner" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open ChatGPT" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Clean up conversations" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bookmarked conversations" })).toBeVisible();
  });

  test("vault shell renders local vault empty or reader chrome", async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/vault.html`);
    await expect(page.getByRole("heading", { name: "Conversation Vault" })).toBeVisible();
    await expect(page.getByText("Local development Vault.", { exact: false })).toBeVisible();
    await expect(page.getByText("No local Vault snapshots yet", { exact: false })).toBeVisible();
  });

  test("content script loads only on chatgpt.com and mounts isolated overlay host", async ({
    context,
  }) => {
    const chatgpt = await context.newPage();
    await chatgpt.route("https://chatgpt.com/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><html><body><h1>ChatGPT fixture</h1></body></html>",
      });
    });
    await chatgpt.goto("https://chatgpt.com/");
    await expect
      .poll(async () => chatgpt.locator("html").getAttribute("data-ce-chatgpt-cleaner"))
      .toBe("loaded");
    await expect(chatgpt.locator("#ce-chatgpt-cleaner-host")).toHaveCount(1);

    const other = await context.newPage();
    await other.route("https://example.com/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><html><body><h1>Other</h1></body></html>",
      });
    });
    await other.goto("https://example.com/");
    await expect(other.locator("html")).not.toHaveAttribute("data-ce-chatgpt-cleaner", "loaded");
    await expect(other.locator("#ce-chatgpt-cleaner-host")).toHaveCount(0);
  });
});
