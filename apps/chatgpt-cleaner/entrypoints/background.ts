import { isExtensionMessage, MESSAGE_VERSION } from "../lib/messaging/schema";
import { focusOrOpenChatgptTab, openCleanupOverlayOnChatgpt } from "../lib/runtime/tabs";

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
            await openCleanupOverlayOnChatgpt();
          } else {
            await focusOrOpenChatgptTab();
          }
          sendResponse({ version: MESSAGE_VERSION, type: "ack", ok: true });
          return;
        }

        sendResponse({
          version: MESSAGE_VERSION,
          type: "ack",
          ok: false,
          error: "지원하지 않는 요청입니다.",
        });
      } catch (error) {
        sendResponse({
          version: MESSAGE_VERSION,
          type: "ack",
          ok: false,
          error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        });
      }
    })();

    return true;
  });
});
