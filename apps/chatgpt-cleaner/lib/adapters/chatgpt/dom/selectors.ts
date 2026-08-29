/**
 * ChatGPT DOM selectors are version-fragile.
 * Keep all host assumptions here; never scatter them through UI/domain code.
 *
 * Live assistant actions (2026): there is no `assistant-action-row` testid.
 * The stable turn-level anchor is `copy-turn-action-button`; the action cluster
 * is that button's surrounding `[role="group"]` (or the nearest button row).
 * See `lib/adapters/chatgpt/dom/EVIDENCE.md`.
 */
export const CHATGPT_SELECTORS = {
  conversationLink:
    'a[href^="/c/"], a[href^="https://chatgpt.com/c/"], a[href^="https://chat.openai.com/c/"]',
  conversationTitleFallback: "[data-ce-conversation-title], title",
  messageArticle: '[data-message-author-role], [data-testid^="conversation-turn"]',
  messageRole: "data-message-author-role",
  messageId: "data-message-id",
  assistantActionRow: [
    '[data-testid="assistant-action-row"]',
    "[data-ce-assistant-actions]",
    '[role="group"][aria-label="Message actions"]',
    '[role="group"][aria-label="回复操作"]',
    '[role="group"][aria-label="메시지 작업"]',
    '[role="group"][aria-label*="response" i]',
  ].join(", "),
  copyTurnActionButton:
    'button[data-testid="copy-turn-action-button"], [data-testid="copy-turn-action-button"]',
  markdownRoot: ".markdown, .prose, [data-message-content]",
  codeBlock: "pre code",
  navHistory: "nav, [data-testid='history'], aside",
} as const;

export const BOOKMARK_ATTR = "data-ce-bookmark-control" as const;
export const BOOKMARK_KEY_ATTR = "data-ce-bookmark-key" as const;
export const BOOKMARK_STATUS_ATTR = "data-ce-bookmark-status" as const;
export const BOOKMARK_COMPAT_ATTR = "data-ce-bookmark-compat" as const;
