import {
  BOOKMARK_ATTR,
  BOOKMARK_COMPAT_ATTR,
  CHATGPT_SELECTORS,
} from "./selectors";
import type { SnapshotMessage } from "../types";

export const ASSISTANT_ACTION_ROW_REASON =
  "assistant action rows not found (copy-turn-action-button / message-actions group)";

const TURN_COPY_ARIA = new Set([
  "copy",
  "copy response",
  "copy message",
  "복사",
  "복사하기",
  "复制",
  "复制回复",
  "複製",
]);

const MORE_NAMES = new Set([
  "more",
  "more actions",
  "more options",
  "더보기",
  "더 보기",
  "추가 작업",
  "更多",
  "更多操作",
]);

const SOURCES_NAMES = new Set([
  "sources",
  "view sources",
  "citations",
  "출처",
  "출처 보기",
  "来源",
  "查看来源",
]);

function normalizeName(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function isCodeCopyContext(el: Element): boolean {
  return el.closest("pre, code, [data-testid*='code']") != null;
}

function isTurnRoot(el: Element): boolean {
  return el.matches(
    '[data-message-author-role], [data-testid^="conversation-turn"], [data-turn]',
  );
}

export function messageRoleForElement(el: Element): SnapshotMessage["role"] {
  const roleHost = el.closest("[data-message-author-role]");
  const directRole = roleHost?.getAttribute("data-message-author-role")?.toLowerCase();
  if (
    directRole === "user" ||
    directRole === "assistant" ||
    directRole === "system" ||
    directRole === "tool"
  ) {
    return directRole;
  }

  const turn = el.closest("[data-turn]");
  const turnRole = turn?.getAttribute("data-turn")?.toLowerCase();
  if (turnRole === "user" || turnRole === "assistant") return turnRole;

  const convTurn = el.closest('[data-testid^="conversation-turn"]');
  if (convTurn) {
    if (convTurn.querySelector('[data-message-author-role="user"]')) return "user";
    if (convTurn.querySelector('[data-message-author-role="assistant"]')) return "assistant";
  }
  return "unknown";
}

export function isAssistantContext(el: Element): boolean {
  return messageRoleForElement(el) === "assistant";
}

export function resolveAssistantActionRow(from: Element): Element {
  const group = from.closest("[role='group']");
  if (group && !isTurnRoot(group)) return group;

  let best: Element | null = from.parentElement;
  let node = from.parentElement;
  for (let i = 0; i < 6 && node && !isTurnRoot(node); i += 1) {
    if (node.querySelectorAll("button").length >= 1) best = node;
    node = node.parentElement;
  }
  return best ?? from.parentElement ?? from;
}

function isTurnCopyButton(button: Element): boolean {
  if (isCodeCopyContext(button)) return false;
  const testid = button.getAttribute("data-testid") ?? "";
  if (testid === "copy-turn-action-button" || testid.includes("copy-turn")) return true;
  const aria = normalizeName(button.getAttribute("aria-label"));
  return TURN_COPY_ARIA.has(aria) && messageRoleForElement(button) !== "unknown";
}

function collectCopyButtons(doc: Document): Element[] {
  const byTestId = Array.from(doc.querySelectorAll(CHATGPT_SELECTORS.copyTurnActionButton));
  const extras = Array.from(doc.querySelectorAll("button")).filter((button) => {
    return !byTestId.includes(button) && isTurnCopyButton(button);
  });
  return [...byTestId, ...extras].filter((el) => !isCodeCopyContext(el));
}

function collectLegacyRows(doc: Document): Element[] {
  return Array.from(doc.querySelectorAll(CHATGPT_SELECTORS.assistantActionRow)).filter((row) =>
    isAssistantContext(row),
  );
}

function collectCopyAnchoredRows(doc: Document): Element[] {
  return collectCopyButtons(doc).map((button) => resolveAssistantActionRow(button));
}

function preferInnermost(rows: Element[]): Element[] {
  const unique = [...new Set(rows)];
  return unique.filter((row) => !unique.some((other) => other !== row && row.contains(other)));
}

export function locateTurnActionRows(doc: Document): Element[] {
  return preferInnermost([...collectLegacyRows(doc), ...collectCopyAnchoredRows(doc)]);
}

export function locateAssistantActionRows(doc: Document): Element[] {
  return locateTurnActionRows(doc).filter((row) => messageRoleForElement(row) === "assistant");
}

export function locateUserActionRows(doc: Document): Element[] {
  return locateTurnActionRows(doc).filter((row) => messageRoleForElement(row) === "user");
}

export function markBookmarkCompatibility(
  doc: Document,
  rowCount = locateAssistantActionRows(doc).length,
): number {
  doc.documentElement.setAttribute(
    BOOKMARK_COMPAT_ATTR,
    rowCount > 0 ? "ok" : "missing-action-row",
  );
  return rowCount;
}

function controlNames(el: Element): string[] {
  return [
    normalizeName(el.getAttribute("aria-label")),
    normalizeName(el.getAttribute("title")),
    normalizeName(el.textContent),
  ].filter((name) => name.length > 0);
}

function findNamedControl(row: Element, names: Set<string>): Element | null {
  const controls = Array.from(row.querySelectorAll("button, [role='button']"));
  for (const control of controls) {
    if (control.getAttribute(BOOKMARK_ATTR) === "true") continue;
    if (controlNames(control).some((name) => names.has(name))) return control;
  }
  return null;
}

export function findMoreActionControl(row: Element): Element | null {
  return findNamedControl(row, MORE_NAMES);
}

export function findSourcesActionControl(row: Element): Element | null {
  return findNamedControl(row, SOURCES_NAMES);
}

function rowChildContaining(row: Element, el: Element): Element | null {
  let node: Element | null = el;
  while (node && node.parentElement !== row) node = node.parentElement;
  return node?.parentElement === row ? node : null;
}

export function insertBookmarkControl(row: Element, button: HTMLButtonElement): void {
  const more = findMoreActionControl(row);
  const moreChild = more ? rowChildContaining(row, more) : null;
  if (moreChild) {
    moreChild.after(button);
    return;
  }

  const sources = findSourcesActionControl(row);
  const sourcesChild = sources ? rowChildContaining(row, sources) : null;
  if (sourcesChild) {
    sourcesChild.before(button);
    return;
  }

  row.append(button);
}

export function findAssociatedMessage(row: Element): Element | null {
  const withRole = row.closest("[data-message-author-role]");
  if (withRole) return withRole;

  const turn = row.closest('[data-testid^="conversation-turn"], [data-turn]');
  if (turn) {
    const role = messageRoleForElement(row);
    if (role === "user") {
      return turn.querySelector('[data-message-author-role="user"]') ?? turn;
    }
    if (role === "assistant") {
      return turn.querySelector('[data-message-author-role="assistant"]') ?? turn;
    }
    return turn.querySelector("[data-message-author-role]") ?? turn;
  }

  return row.closest(CHATGPT_SELECTORS.messageArticle);
}
