export const CHATGPT_ORIGIN = "https://chatgpt.com/";

export async function focusOrOpenChatgptTab(): Promise<number> {
  const existing = await browser.tabs.query({ url: ["https://chatgpt.com/*"] });
  const tab = existing.find((entry) => typeof entry.id === "number");
  if (tab?.id != null) {
    if (tab.windowId != null) {
      await browser.windows.update(tab.windowId, { focused: true });
    }
    await browser.tabs.update(tab.id, { active: true });
    return tab.id;
  }

  const created = await browser.tabs.create({ url: CHATGPT_ORIGIN, active: true });
  if (created.id == null) {
    throw new Error("Failed to open ChatGPT tab");
  }
  return created.id;
}

export async function openVaultTab(): Promise<void> {
  const url = browser.runtime.getURL("/vault.html");
  await browser.tabs.create({ url, active: true });
}

export async function sendTabMessage<T>(tabId: number, message: unknown): Promise<T | undefined> {
  try {
    return (await browser.tabs.sendMessage(tabId, message)) as T;
  } catch {
    return undefined;
  }
}
