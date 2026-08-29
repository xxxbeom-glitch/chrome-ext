import {
  captureCurrentConversation,
  discoverAccountHistory,
  injectBookmarkControls,
  probeCompatibility,
} from "../lib/adapters/chatgpt";
import { createFailClosedMutationAdapter } from "../lib/adapters/chatgpt/mutations";
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
    const mutationAdapter = createFailClosedMutationAdapter();
    const overlay = createCleanupOverlay(document, {
      mutator: mutationAdapter,
      capabilities: mutationAdapter.capabilities,
    });

    const applyProbe = (): void => {
      const probe = probeCompatibility(document);
      overlay.setCapabilities({
        canArchive: probe.capabilities.canArchive && mutationAdapter.capabilities.canArchive,
        canDelete: probe.capabilities.canDelete && mutationAdapter.capabilities.canDelete,
      });
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
      const probe = probeCompatibility(document);
      if (!probe.capabilities.canLocateAssistantActions) return;

      injectBookmarkControls(document, {
        onBookmark: (target, control) => {
          void (async () => {
            control.setStatus("saving");
            const captureProbe = probeCompatibility(document);
            if (!captureProbe.capabilities.canCaptureConversation) {
              control.setStatus("failed", "대화 캡처를 사용할 수 없습니다");
              return;
            }
            const snapshot = captureCurrentConversation(document);
            const ordinal =
              snapshot.messages.find((message) =>
                target.sourceMessageId
                  ? message.sourceMessageId === target.sourceMessageId
                  : false,
              )?.ordinal ??
              snapshot.messages.find((message) => message.role === "assistant")?.ordinal ??
              0;
            const excerpt =
              snapshot.messages
                .find((message) => message.ordinal === ordinal)
                ?.blocks.map((block) => ("text" in block ? block.text : ""))
                .join(" ")
                .slice(0, 120) || target.key;

            try {
              const result = await vaultService.saveSnapshot({
                snapshot,
                anchor: {
                  ...(target.sourceMessageId ? { sourceMessageId: target.sourceMessageId } : {}),
                  messageOrdinal: ordinal,
                  excerpt,
                  anchorKey: target.key,
                },
              });
              if (!result.ok) {
                control.setStatus("failed", result.error);
                return;
              }
              control.setStatus(
                "saved",
                result.backend === "cloud" ? "클라우드 보관함에 저장됨" : "로컬 보관함에 저장됨",
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
