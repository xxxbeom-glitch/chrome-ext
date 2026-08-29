import {
  captureMessage,
  discoverAccountHistory,
  injectBookmarkControls,
  probeCompatibility,
} from "../lib/adapters/chatgpt";
import { createPrivateWebMutationAdapter } from "../lib/adapters/chatgpt/mutations";
import { vaultService } from "../lib/domain/vault/service";
import { isExtensionMessage, MESSAGE_VERSION } from "../lib/messaging/schema";
import { markContentScriptLoaded } from "../lib/runtime/content-marker";
import { createCleanupOverlay } from "../lib/ui/cleanup-overlay";
import type { CleanupListItem } from "../lib/domain/types";

export default defineContentScript({
  matches: ["https://chatgpt.com/*"],
  runAt: "document_idle",
  cssInjectionMode: "manual",
  main(ctx) {
    markContentScriptLoaded(document);
    const mutationAdapter = createPrivateWebMutationAdapter();
    const overlay = createCleanupOverlay(document, {
      mutator: mutationAdapter,
      capabilities: mutationAdapter.capabilities,
    });

    const applyProbe = (): void => {
      // Read/list and mutation compatibility are independent. Live mutations stay
      // behind their private-web adapter; DOM probe drift must not silently change
      // the PATCH contract.
      probeCompatibility(document);
      overlay.setCapabilities(mutationAdapter.capabilities);
    };

    const loadDiscovery = async (): Promise<void> => {
      applyProbe();
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

    const syncBookmarks = (): void => {
      injectBookmarkControls(document, {
        onBookmark: (target, control) => {
          void (async () => {
            control.setStatus("saving");
            try {
              const snapshot = captureMessage(document, target);
              const result = await vaultService.saveItem(snapshot);
              if (!result.ok) {
                control.setStatus("failed", result.error);
                return;
              }
              control.setStatus(
                "saved",
                result.backend === "cloud"
                  ? "이 메시지를 클라우드 보관함에 저장했습니다"
                  : "이 메시지를 로컬 보관함에 저장했습니다",
              );
            } catch (error) {
              control.setStatus(
                "failed",
                error instanceof Error ? error.message : "저장 실패",
              );
            }
          })();
        },
      });
    };

    applyProbe();
    syncBookmarks();

    const observer = new MutationObserver(() => syncBookmarks());
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

      sendResponse({ version: MESSAGE_VERSION, type: "ack", ok: false, error: "unsupported in content" });
      return false;
    });
  },
});
