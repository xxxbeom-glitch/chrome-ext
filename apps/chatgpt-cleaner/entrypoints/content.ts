import { isExtensionMessage, MESSAGE_VERSION } from "../lib/messaging/schema";
import { markContentScriptLoaded } from "../lib/runtime/content-marker";
import { createCleanupOverlay } from "../lib/ui/cleanup-overlay";

export default defineContentScript({
  matches: ["https://chatgpt.com/*"],
  runAt: "document_idle",
  cssInjectionMode: "manual",
  main() {
    markContentScriptLoaded(document);
    const overlay = createCleanupOverlay(document);

    browser.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
      if (!isExtensionMessage(raw)) {
        sendResponse({ version: MESSAGE_VERSION, type: "ack", ok: false, error: "invalid message" });
        return false;
      }

      if (raw.type === "cleanup.open") {
        overlay.open();
        sendResponse({ version: MESSAGE_VERSION, type: "cleanup.status", open: true });
        return false;
      }

      if (raw.type === "cleanup.close") {
        overlay.close();
        sendResponse({ version: MESSAGE_VERSION, type: "cleanup.status", open: false });
        return false;
      }

      sendResponse({ version: MESSAGE_VERSION, type: "ack", ok: false, error: "unsupported in content" });
      return false;
    });
  },
});
