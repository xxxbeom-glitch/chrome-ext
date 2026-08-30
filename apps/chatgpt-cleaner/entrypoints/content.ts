import { discoverAccountHistory } from "../lib/adapters/chatgpt";
import { createPrivateWebMutationAdapter } from "../lib/adapters/chatgpt/mutations";
import { isExtensionMessage, MESSAGE_VERSION } from "../lib/messaging/schema";
import { markContentScriptLoaded } from "../lib/runtime/content-marker";
import { createCleanupOverlay } from "../lib/ui/cleanup-overlay";
import type { CleanupListItem } from "../lib/domain/types";

export default defineContentScript({
  matches: ["https://chatgpt.com/*"],
  runAt: "document_idle",
  cssInjectionMode: "manual",
  main() {
    markContentScriptLoaded(document);

    const mutationAdapter = createPrivateWebMutationAdapter();
    const overlay = createCleanupOverlay(document, {
      mutator: mutationAdapter,
      capabilities: mutationAdapter.capabilities,
    });

    const loadDiscovery = async (): Promise<void> => {
      overlay.setCapabilities(mutationAdapter.capabilities);
      overlay.setDiscovery([], "loading", "대화 목록을 불러오는 중…", "loading");

      const result = await discoverAccountHistory({ document });
      const items: CleanupListItem[] = result.items.map((item) => ({
        sourceId: item.sourceId,
        title: item.title,
        sourceUrl: item.sourceUrl,
        updatedAt: item.updatedAt,
        selected: false,
        status: "idle",
      }));

      overlay.setDiscovery(items, result.completeness, result.userNote, result.outcome);
    };

    browser.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
      if (!isExtensionMessage(raw)) {
        sendResponse({
          version: MESSAGE_VERSION,
          type: "ack",
          ok: false,
          error: "invalid message",
        });
        return false;
      }

      if (raw.type === "cleanup.open") {
        overlay.open();
        void loadDiscovery();
        sendResponse({ version: MESSAGE_VERSION, type: "cleanup.status", open: true });
        return false;
      }

      if (raw.type === "cleanup.close") {
        overlay.close();
        sendResponse({ version: MESSAGE_VERSION, type: "cleanup.status", open: false });
        return false;
      }

      sendResponse({
        version: MESSAGE_VERSION,
        type: "ack",
        ok: false,
        error: "unsupported in content",
      });
      return false;
    });
  },
});
