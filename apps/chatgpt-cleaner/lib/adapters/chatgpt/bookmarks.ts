import {
  findAssociatedMessage,
  insertBookmarkControl,
  locateTurnActionRows,
  markBookmarkCompatibility,
  messageRoleForElement,
} from "./dom/action-row";
import {
  BOOKMARK_ATTR,
  BOOKMARK_KEY_ATTR,
  BOOKMARK_STATUS_ATTR,
  CHATGPT_SELECTORS,
} from "./dom/selectors";
import type { BookmarkAnchorTarget } from "./types";

export const BOOKMARK_LABELS = {
  idle: "보관함에 저장",
  saving: "저장 중",
  saved: "저장됨",
  failed: "다시 시도",
} as const;

function messageIndex(doc: Document, message: Element): number {
  const messages = Array.from(doc.querySelectorAll(CHATGPT_SELECTORS.messageArticle));
  const exact = messages.indexOf(message);
  if (exact >= 0) return exact;
  const containing = messages.findIndex((candidate) => candidate.contains(message));
  return containing >= 0 ? containing : 0;
}

function anchorKey(doc: Document, row: Element, message: Element): string {
  const messageId = message.getAttribute(CHATGPT_SELECTORS.messageId);
  if (messageId) return `msg:${messageId}`;
  const role = messageRoleForElement(message);
  return `${role}:ordinal:${messageIndex(doc, message)}`;
}

export function locateBookmarkAnchors(doc: Document): BookmarkAnchorTarget[] {
  const targets: BookmarkAnchorTarget[] = [];
  for (const actionRow of locateTurnActionRows(doc)) {
    const message = findAssociatedMessage(actionRow);
    if (!message) continue;
    const role = messageRoleForElement(message);
    if (role !== "user" && role !== "assistant") continue;
    const sourceMessageId = message.getAttribute(CHATGPT_SELECTORS.messageId) ?? undefined;
    targets.push({
      key: anchorKey(doc, actionRow, message),
      ...(sourceMessageId ? { sourceMessageId } : {}),
      actionRow,
      messageElement: message,
      role,
    });
  }
  return targets;
}

export type BookmarkSaveStatus = "idle" | "saving" | "saved" | "failed";

export interface InjectBookmarkOptions {
  onBookmark: (target: BookmarkAnchorTarget, control: BookmarkControlHandle) => void;
}

export interface BookmarkControlHandle {
  setStatus(status: BookmarkSaveStatus, detail?: string): void;
}

function createBookmarkIcon(doc: Document, filled: boolean): SVGSVGElement {
  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.style.pointerEvents = "none";
  svg.style.display = "block";

  const path = doc.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z");
  path.setAttribute("fill", filled ? "currentColor" : "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.append(path);
  return svg;
}

function styleHostActionButton(button: HTMLButtonElement): void {
  button.style.display = "inline-flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.width = "36px";
  button.style.height = "36px";
  button.style.margin = "0";
  button.style.padding = "0";
  button.style.border = "0";
  button.style.borderRadius = "8px";
  button.style.background = "transparent";
  button.style.color = "inherit";
  button.style.flex = "0 0 auto";
  button.style.lineHeight = "0";
  button.style.appearance = "none";
}

function applyStatus(button: HTMLButtonElement, status: BookmarkSaveStatus, detail?: string): void {
  const label = BOOKMARK_LABELS[status];
  button.disabled = status === "saving";
  button.style.cursor = status === "saving" ? "default" : "pointer";
  button.title = detail ?? label;
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-busy", status === "saving" ? "true" : "false");
  button.setAttribute(BOOKMARK_STATUS_ATTR, status);
  button.replaceChildren(createBookmarkIcon(button.ownerDocument, status === "saved"));
}

function createBookmarkButton(doc: Document): HTMLButtonElement {
  const button = doc.createElement("button");
  button.type = "button";
  button.setAttribute(BOOKMARK_ATTR, "true");
  styleHostActionButton(button);
  applyStatus(button, "idle");

  button.addEventListener("pointerenter", () => {
    if (!button.disabled) button.style.background = "rgba(127,127,127,0.12)";
  });
  button.addEventListener("pointerleave", () => {
    button.style.background = "transparent";
  });

  return button;
}

export function injectBookmarkControls(
  doc: Document,
  options: InjectBookmarkOptions,
): { injected: number; skipped: number } {
  const targets = locateBookmarkAnchors(doc);
  markBookmarkCompatibility(
    doc,
    targets.filter((target) => target.role === "assistant").length,
  );

  let injected = 0;
  let skipped = 0;

  for (const target of targets) {
    if (target.actionRow.querySelector(`[${BOOKMARK_ATTR}="true"]`)) {
      skipped += 1;
      continue;
    }

    const button = createBookmarkButton(doc);
    button.setAttribute(BOOKMARK_KEY_ATTR, target.key);
    button.dataset.ceBookmarkRole = target.role;

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

    insertBookmarkControl(target.actionRow, button);
    injected += 1;
  }

  return { injected, skipped };
}
