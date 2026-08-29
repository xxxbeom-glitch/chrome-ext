import {
  captureCurrentConversation,
  discoverConversationsFromDom,
  injectBookmarkControls,
  probeCompatibility,
} from "../lib/adapters/chatgpt";
import { isExtensionMessage, MESSAGE_VERSION } from "../lib/messaging/schema";
import { markContentScriptLoaded } from "../lib/runtime/content-marker";
import { saveLocalSnapshotPreview } from "../lib/storage/local-preview";
import { createCleanupOverlay } from "../lib/ui/cleanup-overlay";
import type { CleanupListItem } from "../lib/domain/types";

export default defineContentScript({
  matches: ["https://chatgpt.com/*"],
  runAt: "document_idle",
  cssInjectionMode: "manual",
  main(ctx) {
    markContentScriptLoaded(document);
    const overlay = createCleanupOverlay(document);

    const refreshDiscovery = (): void => {
      const probe = probeCompatibility(document);
      if (!probe.capabilities.canDiscoverConversations) {
        overlay.setDiscovery(
          [],
          "unknown",
          `ChatGPT changed or sidebar unavailable (${probe.reasons.join("; ") || "incompatible"}). Destructive actions stay disabled.`,
        );
        return;
      }

      const page = discoverConversationsFromDom(document);
      const items: CleanupListItem[] = page.items.map((item) => ({
        sourceId: item.sourceId,
        title: item.title,
        sourceUrl: item.sourceUrl,
        selected: false,
        status: "idle",
      }));
      overlay.setDiscovery(
        items,
        page.completeness,
        "Live DOM discovery (read-only). End of account history is not confirmed from the sidebar alone.",
      );
    };

    const syncBookmarks = (): void => {
      const probe = probeCompatibility(document);
      if (!probe.capabilities.canLocateAssistantActions) return;

      injectBookmarkControls(document, {
        onBookmark: (target) => {
          const captureProbe = probeCompatibility(document);
          if (!captureProbe.capabilities.canCaptureConversation) {
            console.info("[chatgpt-cleaner] capture unavailable; fail closed");
            return;
          }
          const snapshot = captureCurrentConversation(document);
          void saveLocalSnapshotPreview(snapshot, target.key);
        },
      });
    };

    refreshDiscovery();
    syncBookmarks();

    const observer = new MutationObserver(() => {
      syncBookmarks();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    ctx.onInvalidated(() => observer.disconnect());

    browser.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
      if (!isExtensionMessage(raw)) {
        sendResponse({ version: MESSAGE_VERSION, type: "ack", ok: false, error: "invalid message" });
        return false;
      }

      if (raw.type === "cleanup.open") {
        refreshDiscovery();
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
