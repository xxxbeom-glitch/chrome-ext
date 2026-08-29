import {
  BOOKMARK_ATTR,
  BOOKMARK_KEY_ATTR,
  CHATGPT_SELECTORS,
} from "./dom/selectors";
import type { BookmarkAnchorTarget } from "./types";

function anchorKey(row: Element, index: number): string {
  const message = row.closest(CHATGPT_SELECTORS.messageArticle);
  const messageId = message?.getAttribute(CHATGPT_SELECTORS.messageId);
  if (messageId) return `msg:${messageId}`;
  return `ordinal:${index}`;
}

export function locateBookmarkAnchors(doc: Document): BookmarkAnchorTarget[] {
  return Array.from(doc.querySelectorAll(CHATGPT_SELECTORS.assistantActionRow)).map(
    (actionRow, index) => {
      const message = actionRow.closest(CHATGPT_SELECTORS.messageArticle);
      const sourceMessageId = message?.getAttribute(CHATGPT_SELECTORS.messageId) ?? undefined;
      return {
        key: anchorKey(actionRow, index),
        ...(sourceMessageId ? { sourceMessageId } : {}),
        actionRow,
      };
    },
  );
}

export interface InjectBookmarkOptions {
  onBookmark: (target: BookmarkAnchorTarget) => void;
}

export function injectBookmarkControls(
  doc: Document,
  options: InjectBookmarkOptions,
): { injected: number; skipped: number } {
  let injected = 0;
  let skipped = 0;

  for (const target of locateBookmarkAnchors(doc)) {
    if (target.actionRow.querySelector(`[${BOOKMARK_ATTR}="true"]`)) {
      skipped += 1;
      continue;
    }

    const button = doc.createElement("button");
    button.type = "button";
    button.textContent = "Vault";
    button.setAttribute("aria-label", "Save conversation to Vault");
    button.setAttribute(BOOKMARK_ATTR, "true");
    button.setAttribute(BOOKMARK_KEY_ATTR, target.key);
    button.style.marginInlineStart = "8px";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      options.onBookmark(target);
    });

    target.actionRow.append(button);
    injected += 1;
  }

  return { injected, skipped };
}
