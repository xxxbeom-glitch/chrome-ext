import { test as base, chromium, expect, type BrowserContext } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { TWO_ASSISTANT_ANSWERS_FIXTURE } from "../fixtures/chatgpt/pages";

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

test.describe("extension harness", () => {
  test("popup shell renders launcher actions", async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(page.getByRole("heading", { name: "ChatGPT 대화 정리" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ChatGPT 열기" })).toBeVisible();
    await expect(page.getByRole("button", { name: "대화방 정리하기" })).toBeVisible();
    await expect(page.getByRole("button", { name: "북마크 보관함" })).toBeVisible();
    await expect(page.getByRole("button", { name: /클라우드 설정 필요|Google로 로그인|로그아웃/ })).toBeVisible();
  });

  test("vault shell is message-centric", async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/vault.html`);
    await expect(page.getByRole("heading", { name: "북마크 보관함" })).toBeVisible();
    await expect(page.getByText("로컬에 저장한 질문과 답변입니다", { exact: false })).toBeVisible();
    await expect(page.getByText("로컬에 저장한 질문이나 답변이 없습니다", { exact: false })).toBeVisible();
    await expect(
      page.getByText("해당 메시지 하나만 여기에 저장됩니다", { exact: false }),
    ).toBeVisible();
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
    await expect(chatgpt.locator("html")).toHaveAttribute("data-ce-bookmark-compat", "missing-action-row");

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

  test("injects one bookmark icon per current ChatGPT action row", async ({ context }) => {
    const chatgpt = await context.newPage();
    await chatgpt.route("https://chatgpt.com/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: TWO_ASSISTANT_ANSWERS_FIXTURE,
      });
    });
    await chatgpt.goto("https://chatgpt.com/c/abc-111");

    await expect
      .poll(async () => chatgpt.locator("html").getAttribute("data-ce-chatgpt-cleaner"))
      .toBe("loaded");
    await expect(chatgpt.locator("html")).toHaveAttribute("data-ce-bookmark-compat", "ok");
    await expect(chatgpt.locator("[data-ce-bookmark-control='true']")).toHaveCount(2);

    const firstRow = chatgpt.locator("[data-turn='assistant']").first().locator("[role='group']");
    await expect(firstRow.locator("[data-ce-bookmark-control='true']")).toHaveCount(1);
    await expect(firstRow.locator("button[aria-label='보관함에 저장']")).toBeVisible();

    const order = await firstRow.evaluate((row) => {
      const children = Array.from(row.children);
      return {
        more: children.findIndex((child) => child.getAttribute("aria-label") === "더보기"),
        bookmark: children.findIndex(
          (child) => child.getAttribute("data-ce-bookmark-control") === "true",
        ),
        sources: children.findIndex((child) => child.getAttribute("aria-label") === "출처"),
      };
    });
    expect(order.more).toBeGreaterThanOrEqual(0);
    expect(order.sources).toBeGreaterThan(order.more);
    expect(order.bookmark).toBeGreaterThan(order.more);
    expect(order.bookmark).toBeLessThan(order.sources);

    await chatgpt.evaluate(() => {
      const main = document.body;
      const turn = document.createElement("article");
      turn.setAttribute("data-testid", "conversation-turn-5");
      turn.setAttribute("data-turn", "assistant");
      turn.innerHTML = `
        <div data-message-author-role="assistant" data-message-id="a3">
          <div class="markdown"><p>Third answer</p></div>
        </div>
        <div role="group" aria-label="Message actions">
          <button type="button" data-testid="copy-turn-action-button" aria-label="복사">복사</button>
          <button type="button" aria-label="더보기">...</button>
          <button type="button" aria-label="출처">출처</button>
        </div>
      `;
      main.append(turn);
    });

    await expect(chatgpt.locator("[data-ce-bookmark-control='true']")).toHaveCount(3);
    await expect(chatgpt.locator("[data-turn='assistant']").last().locator("[data-ce-bookmark-control='true']")).toHaveCount(1);
  });

  test("injects bookmarks into compatible user and assistant turns", async ({ context }) => {
    const chatgpt = await context.newPage();
    await chatgpt.route("https://chatgpt.com/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: `<!doctype html><html><body>
          <article data-turn="user" data-testid="conversation-turn-1">
            <div data-message-author-role="user" data-message-id="u1"><div class="markdown"><p>Question</p></div></div>
            <div role="group" aria-label="Message actions"><button data-testid="copy-turn-action-button" aria-label="복사">복사</button><button aria-label="더보기">...</button></div>
          </article>
          <article data-turn="assistant" data-testid="conversation-turn-2">
            <div data-message-author-role="assistant" data-message-id="a1"><div class="markdown"><p>Answer</p></div></div>
            <div role="group" aria-label="Message actions"><button data-testid="copy-turn-action-button" aria-label="복사">복사</button><button aria-label="더보기">...</button></div>
          </article>
        </body></html>`,
      });
    });
    await chatgpt.goto("https://chatgpt.com/c/abc-111");
    await expect
      .poll(async () => chatgpt.locator("html").getAttribute("data-ce-chatgpt-cleaner"))
      .toBe("loaded");
    await expect(chatgpt.locator("[data-ce-bookmark-control='true']")).toHaveCount(2);
    await expect(chatgpt.locator("[data-ce-bookmark-role='user']")).toHaveCount(1);
    await expect(chatgpt.locator("[data-ce-bookmark-role='assistant']")).toHaveCount(1);
  });
});
