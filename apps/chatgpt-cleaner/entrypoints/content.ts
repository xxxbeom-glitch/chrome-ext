import {
  captureCurrentConversation,
  discoverConversationsFromDom,
  injectBookmarkControls,
  probeCompatibility,
} from "../lib/adapters/chatgpt";
import { createFailClosedMutationAdapter } from "../lib/adapters/chatgpt/mutations";
import {
  loadLocalVault,
  persistLocalVault,
} from "../lib/domain/vault/local-repository";
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
        "Live DOM discovery. Archive/Delete remain fail-closed until mutation compatibility is positively proven.",
      );
    };

    const syncBookmarks = (): void => {
      const probe = probeCompatibility(document);
      if (!probe.capabilities.canLocateAssistantActions) return;

      injectBookmarkControls(document, {
        onBookmark: (target) => {
          void (async () => {
            const captureProbe = probeCompatibility(document);
            if (!captureProbe.capabilities.canCaptureConversation) return;
            const snapshot = captureCurrentConversation(document);
            const repo = await loadLocalVault();
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
            const result = repo.saveSnapshot({
              snapshot,
              anchor: {
                ...(target.sourceMessageId ? { sourceMessageId: target.sourceMessageId } : {}),
                messageOrdinal: ordinal,
                excerpt,
                anchorKey: target.key,
              },
            });
            if (result.ok) {
              await persistLocalVault(repo);
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
