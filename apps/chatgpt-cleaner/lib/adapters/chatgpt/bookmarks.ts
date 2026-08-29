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

export type BookmarkSaveStatus = "idle" | "saving" | "saved" | "failed";

export interface InjectBookmarkOptions {
  onBookmark: (target: BookmarkAnchorTarget, control: BookmarkControlHandle) => void;
}

export interface BookmarkControlHandle {
  setStatus(status: BookmarkSaveStatus, detail?: string): void;
}

function applyStatus(button: HTMLButtonElement, status: BookmarkSaveStatus, detail?: string): void {
  switch (status) {
    case "saving":
      button.textContent = "Saving…";
      button.disabled = true;
      button.title = "Saving snapshot to Vault";
      break;
    case "saved":
      button.textContent = "Saved";
      button.disabled = false;
      button.title = detail ?? "Saved to Vault";
      break;
    case "failed":
      button.textContent = "Retry";
      button.disabled = false;
      button.title = detail ?? "Save failed";
      break;
    default:
      button.textContent = "Vault";
      button.disabled = false;
      button.title = "Save conversation to Vault";
  }
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
    button.setAttribute("aria-label", "Save conversation to Vault");
    button.setAttribute(BOOKMARK_ATTR, "true");
    button.setAttribute(BOOKMARK_KEY_ATTR, target.key);
    button.style.marginInlineStart = "8px";
    applyStatus(button, "idle");

    const control: BookmarkControlHandle = {
      setStatus(status, detail) {
        applyStatus(button, status, detail);
      },
    };

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      options.onBookmark(target, control);
    });

    target.actionRow.append(button);
    injected += 1;
  }

  return { injected, skipped };
}
