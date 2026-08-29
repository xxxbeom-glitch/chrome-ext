import { describe, expect, it, vi } from "vitest";
import { MESSAGE_VERSION } from "../../lib/messaging/schema";
import {
  CLEANUP_CONNECT_ERROR,
  isCleanupOpenedResponse,
  openCleanupOverlayOnChatgpt,
  pickChatgptTab,
  type OpenCleanupDeps,
  type TabLike,
} from "../../lib/runtime/tabs";

function openedResponse() {
  return { version: MESSAGE_VERSION, type: "cleanup.status" as const, open: true };
}

function createDeps(
  overrides: Partial<OpenCleanupDeps> & Pick<OpenCleanupDeps, "focusOrOpen" | "sendCleanupOpen">,
): OpenCleanupDeps {
  return {
    getTab: async () => ({ id: 1, status: "complete" }),
    waitForComplete: vi.fn(async () => undefined),
    reloadTab: vi.fn(async () => undefined),
    sleep: vi.fn(async () => undefined),
    initialPollAttempts: 3,
    recoveryPollAttempts: 3,
    pollIntervalMs: 0,
    ...overrides,
  };
}

describe("pickChatgptTab", () => {
  const tabs: TabLike[] = [
    { id: 1, active: false, windowId: 10, lastAccessed: 100 },
    { id: 2, active: true, windowId: 20, lastAccessed: 50 },
    { id: 3, active: false, windowId: 10, lastAccessed: 300 },
  ];

  it("prefers the active tab in the current window", () => {
    const local: TabLike[] = [
      { id: 1, active: true, windowId: 10, lastAccessed: 1 },
      { id: 2, active: true, windowId: 20, lastAccessed: 999 },
    ];
    expect(pickChatgptTab(local, { currentWindowId: 10 })?.id).toBe(1);
  });

  it("falls back to any active ChatGPT tab", () => {
    expect(pickChatgptTab(tabs, { currentWindowId: 99 })?.id).toBe(2);
  });

  it("falls back to most recently accessed tab", () => {
    const inactive = tabs.map((tab) => ({ ...tab, active: false }));
    expect(pickChatgptTab(inactive)?.id).toBe(3);
  });

  it("returns undefined when no tabs exist", () => {
    expect(pickChatgptTab([])).toBeUndefined();
  });
});

describe("isCleanupOpenedResponse", () => {
  it("accepts cleanup.status open=true only", () => {
    expect(isCleanupOpenedResponse(openedResponse())).toBe(true);
    expect(
      isCleanupOpenedResponse({ version: MESSAGE_VERSION, type: "cleanup.status", open: false }),
    ).toBe(false);
    expect(isCleanupOpenedResponse({ version: MESSAGE_VERSION, type: "ack", ok: true })).toBe(false);
  });
});

describe("openCleanupOverlayOnChatgpt", () => {
  it("opens immediately when content listener responds", async () => {
    const sendCleanupOpen = vi.fn(async () => openedResponse());
    const reloadTab = vi.fn(async () => undefined);
    await openCleanupOverlayOnChatgpt(
      createDeps({
        focusOrOpen: async () => ({ tabId: 7, created: false }),
        sendCleanupOpen,
        reloadTab,
      }),
    );
    expect(sendCleanupOpen).toHaveBeenCalledTimes(1);
    expect(reloadTab).not.toHaveBeenCalled();
  });

  it("waits for load on a newly created tab before opening", async () => {
    const waitForComplete = vi.fn(async () => undefined);
    const sendCleanupOpen = vi.fn(async () => openedResponse());
    await openCleanupOverlayOnChatgpt(
      createDeps({
        focusOrOpen: async () => ({ tabId: 8, created: true }),
        getTab: async () => ({ id: 8, status: "loading" }),
        waitForComplete,
        sendCleanupOpen,
      }),
    );
    expect(waitForComplete).toHaveBeenCalledWith(8);
    expect(sendCleanupOpen).toHaveBeenCalled();
  });

  it("reloads and recovers when the first open attempts fail", async () => {
    const sendCleanupOpen = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(openedResponse());
    const reloadTab = vi.fn(async () => undefined);
    const waitForComplete = vi.fn(async () => undefined);

    await openCleanupOverlayOnChatgpt(
      createDeps({
        focusOrOpen: async () => ({ tabId: 9, created: false }),
        sendCleanupOpen,
        reloadTab,
        waitForComplete,
      }),
    );

    expect(reloadTab).toHaveBeenCalledWith(9);
    expect(waitForComplete).toHaveBeenCalledWith(9);
    expect(sendCleanupOpen.mock.calls.length).toBeGreaterThan(3);
  });

  it("throws a Korean user error when recovery also fails", async () => {
    const sendCleanupOpen = vi.fn(async () => undefined);
    await expect(
      openCleanupOverlayOnChatgpt(
        createDeps({
          focusOrOpen: async () => ({ tabId: 10, created: false }),
          sendCleanupOpen,
        }),
      ),
    ).rejects.toThrow(CLEANUP_CONNECT_ERROR);
  });
});
