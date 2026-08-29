import {
  captureCurrentConversation,
  discoverConversationsFromDom,
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

    const refreshDiscovery = (): void => {
      const probe = probeCompatibility(document);
      overlay.setCapabilities({
        canArchive: probe.capabilities.canArchive && mutationAdapter.capabilities.canArchive,
        canDelete: probe.capabilities.canDelete && mutationAdapter.capabilities.canDelete,
      });

      if (!probe.capabilities.canDiscoverConversations) {
        overlay.setDiscovery(
          [],
          "unknown",
          `ChatGPT가 바뀌었거나 사이드바를 쓸 수 없습니다 (${probe.reasons.join("; ") || "호환되지 않음"}). 위험 작업은 비활성화됩니다.`,
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
        "실시간 DOM 목록입니다. ChatGPT 호환성이 확인될 때까지 보관/삭제는 실행되지 않습니다.",
      );
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
