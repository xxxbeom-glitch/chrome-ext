import { isExtensionMessage, MESSAGE_VERSION } from "../messaging/schema";

export const CHATGPT_ORIGIN = "https://chatgpt.com/";

export const CLEANUP_CONNECT_ERROR =
  "ChatGPT 페이지와 연결하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.";

export interface TabLike {
  id?: number;
  active?: boolean;
  windowId?: number;
  lastAccessed?: number;
  status?: string;
  url?: string;
}

export function pickChatgptTab(
  tabs: TabLike[],
  options: { currentWindowId?: number; focusedWindowId?: number } = {},
): TabLike | undefined {
  const withIds = tabs.filter((tab) => typeof tab.id === "number");
  if (withIds.length === 0) return undefined;

  const { currentWindowId, focusedWindowId } = options;

  const activeInCurrent = withIds.find(
    (tab) => tab.active && currentWindowId != null && tab.windowId === currentWindowId,
  );
  if (activeInCurrent) return activeInCurrent;

  const activeInFocused = withIds.find(
    (tab) => tab.active && focusedWindowId != null && tab.windowId === focusedWindowId,
  );
  if (activeInFocused) return activeInFocused;

  const anyActive = withIds.find((tab) => tab.active);
  if (anyActive) return anyActive;

  return [...withIds].sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))[0];
}

export function isCleanupOpenedResponse(value: unknown): boolean {
  return isExtensionMessage(value) && value.type === "cleanup.status" && value.open === true;
}

export function createCleanupOpenMessage() {
  return { version: MESSAGE_VERSION, type: "cleanup.open" as const };
}

export async function sendTabMessage<T>(tabId: number, message: unknown): Promise<T | undefined> {
  try {
    return (await browser.tabs.sendMessage(tabId, message)) as T;
  } catch {
    return undefined;
  }
}

export async function waitForTabComplete(
  tabId: number,
  options: { timeoutMs?: number; getTab?: (id: number) => Promise<TabLike> } = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const getTab = options.getTab ?? ((id: number) => browser.tabs.get(id) as Promise<TabLike>);

  const current = await getTab(tabId);
  if (current.status === "complete") return;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      browser.tabs.onUpdated.removeListener(onUpdated);
      reject(new Error(CLEANUP_CONNECT_ERROR));
    }, timeoutMs);

    function onUpdated(updatedId: number, info: { status?: string }): void {
      if (updatedId !== tabId || info.status !== "complete") return;
      clearTimeout(timer);
      browser.tabs.onUpdated.removeListener(onUpdated);
      resolve();
    }

    browser.tabs.onUpdated.addListener(onUpdated);
  });
}

export async function focusOrOpenChatgptTab(): Promise<{ tabId: number; created: boolean }> {
  const existing = (await browser.tabs.query({
    url: ["https://chatgpt.com/*"],
  })) as TabLike[];

  let currentWindowId: number | undefined;
  let focusedWindowId: number | undefined;
  try {
    const current = await browser.windows.getCurrent();
    currentWindowId = current.id;
  } catch {
    // popup may not have a window context in some harnesses
  }
  try {
    const focused = await browser.windows.getLastFocused();
    focusedWindowId = focused.id;
  } catch {
    // ignore
  }

  const picked = pickChatgptTab(existing, { currentWindowId, focusedWindowId });
  if (picked?.id != null) {
    if (picked.windowId != null) {
      await browser.windows.update(picked.windowId, { focused: true });
    }
    await browser.tabs.update(picked.id, { active: true });
    return { tabId: picked.id, created: false };
  }

  const created = await browser.tabs.create({ url: CHATGPT_ORIGIN, active: true });
  if (created.id == null) {
    throw new Error("ChatGPT 탭을 열지 못했습니다.");
  }
  return { tabId: created.id, created: true };
}

export interface OpenCleanupDeps {
  focusOrOpen: () => Promise<{ tabId: number; created: boolean }>;
  getTab: (tabId: number) => Promise<TabLike>;
  waitForComplete: (tabId: number) => Promise<void>;
  reloadTab: (tabId: number) => Promise<void>;
  sendCleanupOpen: (tabId: number) => Promise<unknown>;
  sleep: (ms: number) => Promise<void>;
  initialPollAttempts: number;
  recoveryPollAttempts: number;
  pollIntervalMs: number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createDefaultOpenCleanupDeps(): OpenCleanupDeps {
  return {
    focusOrOpen: focusOrOpenChatgptTab,
    getTab: (tabId) => browser.tabs.get(tabId) as Promise<TabLike>,
    waitForComplete: (tabId) => waitForTabComplete(tabId),
    reloadTab: async (tabId) => {
      await browser.tabs.reload(tabId);
    },
    sendCleanupOpen: (tabId) => sendTabMessage(tabId, createCleanupOpenMessage()),
    sleep: defaultSleep,
    initialPollAttempts: 4,
    recoveryPollAttempts: 24,
    pollIntervalMs: 250,
  };
}

async function pollCleanupOpen(
  deps: OpenCleanupDeps,
  tabId: number,
  attempts: number,
): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await deps.sendCleanupOpen(tabId);
    if (isCleanupOpenedResponse(response)) return true;
    if (attempt + 1 < attempts) {
      await deps.sleep(deps.pollIntervalMs);
    }
  }
  return false;
}

export async function openCleanupOverlayOnChatgpt(
  deps: OpenCleanupDeps = createDefaultOpenCleanupDeps(),
): Promise<void> {
  const { tabId, created } = await deps.focusOrOpen();
  const tab = await deps.getTab(tabId);

  if (created || tab.status !== "complete") {
    await deps.waitForComplete(tabId);
  }

  const firstAttempts = created ? deps.recoveryPollAttempts : deps.initialPollAttempts;
  if (await pollCleanupOpen(deps, tabId, firstAttempts)) return;

  await deps.reloadTab(tabId);
  await deps.waitForComplete(tabId);

  if (await pollCleanupOpen(deps, tabId, deps.recoveryPollAttempts)) return;

  throw new Error(CLEANUP_CONNECT_ERROR);
}
