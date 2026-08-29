import { isExtensionMessage, MESSAGE_VERSION } from "../lib/messaging/schema";
import {
  focusOrOpenChatgptTab,
  openVaultTab,
  sendTabMessage,
} from "../lib/runtime/tabs";

async function openCleanupOnChatgpt(): Promise<void> {
  const tabId = await focusOrOpenChatgptTab();
  const response = await sendTabMessage(tabId, {
    version: MESSAGE_VERSION,
    type: "cleanup.open",
  });

  if (!response) {
    // Content script may not be ready yet on a freshly opened tab.
    await new Promise((resolve) => setTimeout(resolve, 750));
    await sendTabMessage(tabId, {
      version: MESSAGE_VERSION,
      type: "cleanup.open",
    });
  }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
    if (!isExtensionMessage(raw)) {
      sendResponse({ version: MESSAGE_VERSION, type: "ack", ok: false, error: "invalid message" });
      return false;
    }

    void (async () => {
      try {
        if (raw.type === "tabs.openChatgpt") {
          if (raw.openCleanup) {
            await openCleanupOnChatgpt();
          } else {
            await focusOrOpenChatgptTab();
          }
          sendResponse({ version: MESSAGE_VERSION, type: "ack", ok: true });
          return;
        }

        if (raw.type === "tabs.openVault") {
          await openVaultTab();
          sendResponse({ version: MESSAGE_VERSION, type: "ack", ok: true });
          return;
        }

        sendResponse({ version: MESSAGE_VERSION, type: "ack", ok: false, error: "unsupported in background" });
      } catch (error) {
        sendResponse({
          version: MESSAGE_VERSION,
          type: "ack",
          ok: false,
          error: error instanceof Error ? error.message : "unknown error",
        });
      }
    })();

    return true;
  });
});
