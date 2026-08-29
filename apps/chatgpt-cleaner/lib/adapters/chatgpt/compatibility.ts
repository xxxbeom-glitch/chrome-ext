import { CHATGPT_SELECTORS } from "./dom/selectors";
import type { ChatGptCapabilities } from "./types";

export interface CompatibilityProbeResult {
  compatible: boolean;
  capabilities: ChatGptCapabilities;
  reasons: string[];
}

const DISABLED: ChatGptCapabilities = {
  canDiscoverConversations: false,
  canConfirmDiscoveryEnd: false,
  canArchive: false,
  canDelete: false,
  canCaptureConversation: false,
  canLocateAssistantActions: false,
};

export function probeCompatibility(doc: Document): CompatibilityProbeResult {
  const reasons: string[] = [];
  const onChatgptHost = /^(chatgpt\.com|chat\.openai\.com)$/i.test(doc.location.hostname);
  if (!onChatgptHost && doc.location.protocol !== "about:") {
    // about:blank fixtures / happy-dom may not set hostname; allow DOM-only probes in tests.
    if (doc.location.hostname && doc.location.hostname !== "localhost") {
      reasons.push(`unexpected host: ${doc.location.hostname}`);
      return { compatible: false, capabilities: DISABLED, reasons };
    }
  }

  const hasLinks = doc.querySelector(CHATGPT_SELECTORS.conversationLink) != null;
  const hasMessages = doc.querySelector(CHATGPT_SELECTORS.messageArticle) != null;
  const hasActions = doc.querySelector(CHATGPT_SELECTORS.assistantActionRow) != null;

  if (!hasLinks) reasons.push("conversation links not found");
  if (!hasMessages) reasons.push("conversation messages not found");
  if (!hasActions) reasons.push("assistant action rows not found");

  const capabilities: ChatGptCapabilities = {
    canDiscoverConversations: hasLinks,
    // DOM sidebar alone cannot prove end-of-account-history.
    canConfirmDiscoveryEnd: false,
    canArchive: false,
    canDelete: false,
    canCaptureConversation: hasMessages,
    canLocateAssistantActions: hasActions,
  };

  const compatible =
    capabilities.canDiscoverConversations ||
    capabilities.canCaptureConversation ||
    capabilities.canLocateAssistantActions;

  if (!compatible && reasons.length === 0) {
    reasons.push("no recognized ChatGPT surfaces");
  }

  return { compatible, capabilities, reasons };
}
