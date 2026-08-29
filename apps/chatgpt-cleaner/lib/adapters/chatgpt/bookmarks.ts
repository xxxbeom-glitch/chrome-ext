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
      button.textContent = "저장 중...";
      button.disabled = true;
      button.title = "보관함에 저장하는 중";
      break;
    case "saved":
      button.textContent = "저장됨";
      button.disabled = false;
      button.title = detail ?? "보관함에 저장됨";
      break;
    case "failed":
      button.textContent = "다시 시도";
      button.disabled = false;
      button.title = detail ?? "저장 실패";
      break;
    default:
      button.textContent = "보관함";
      button.disabled = false;
      button.title = "대화를 보관함에 저장";
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
    button.setAttribute("aria-label", "대화를 보관함에 저장");
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
