/**
 * ChatGPT DOM selectors are version-fragile.
 * Keep all host assumptions here; never scatter them through UI/domain code.
 */
export const CHATGPT_SELECTORS = {
  conversationLink: 'a[href^="/c/"]',
  conversationTitleFallback: "[data-ce-conversation-title], title",
  messageArticle: '[data-message-author-role], [data-testid^="conversation-turn"]',
  messageRole: "data-message-author-role",
  messageId: "data-message-id",
  assistantActionRow:
    '[data-testid="assistant-action-row"], [data-ce-assistant-actions], div[role="group"][aria-label*="response" i]',
  markdownRoot: ".markdown, .prose, [data-message-content]",
  codeBlock: "pre code",
  navHistory: "nav, [data-testid='history'], aside",
} as const;

export const BOOKMARK_ATTR = "data-ce-bookmark-control" as const;
export const BOOKMARK_KEY_ATTR = "data-ce-bookmark-key" as const;
