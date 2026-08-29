import { CHATGPT_SELECTORS } from "./dom/selectors";
import type {
  BookmarkAnchorTarget,
  ConversationSnapshot,
  MessageSnapshot,
  SnapshotBlock,
  SnapshotMessage,
} from "./types";

function roleFromElement(el: Element): SnapshotMessage["role"] {
  const roleHost = el.matches("[data-message-author-role]")
    ? el
    : el.querySelector("[data-message-author-role]");
  const role = roleHost?.getAttribute(CHATGPT_SELECTORS.messageRole)?.toLowerCase();
  if (role === "user" || role === "assistant" || role === "system" || role === "tool") {
    return role;
  }
  const turnRole = el.getAttribute("data-turn")?.toLowerCase();
  if (turnRole === "user" || turnRole === "assistant") return turnRole;
  return "unknown";
}

export function extractBlocks(root: Element): SnapshotBlock[] {
  const blocks: SnapshotBlock[] = [];
  const markdown = root.querySelector(CHATGPT_SELECTORS.markdownRoot) ?? root;

  for (const pre of Array.from(markdown.querySelectorAll(CHATGPT_SELECTORS.codeBlock))) {
    const language = pre.getAttribute("class")?.match(/language-([\w-]+)/)?.[1];
    blocks.push({
      type: "code",
      text: pre.textContent ?? "",
      ...(language ? { language } : {}),
    });
  }

  for (const media of Array.from(markdown.querySelectorAll("img, video, audio"))) {
    blocks.push({
      type: "unsupported-media",
      label: media.getAttribute("alt") || media.tagName.toLowerCase(),
    });
  }

  for (const link of Array.from(markdown.querySelectorAll("a[href]"))) {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("javascript:")) continue;
    blocks.push({
      type: "link",
      href,
      label: (link.textContent ?? href).trim() || href,
    });
  }

  for (const heading of Array.from(markdown.querySelectorAll("h1,h2,h3,h4,h5,h6"))) {
    const text = (heading.textContent ?? "").trim();
    if (text) blocks.push({ type: "heading", text });
  }

  for (const list of Array.from(markdown.querySelectorAll("ul,ol"))) {
    const items = Array.from(list.querySelectorAll(":scope > li"))
      .map((li) => (li.textContent ?? "").trim())
      .filter(Boolean);
    if (items.length > 0) blocks.push({ type: "list", items });
  }

  for (const quote of Array.from(markdown.querySelectorAll("blockquote"))) {
    const text = (quote.textContent ?? "").trim();
    if (text) blocks.push({ type: "quote", text });
  }

  for (const table of Array.from(markdown.querySelectorAll("table"))) {
    blocks.push({ type: "table", text: (table.textContent ?? "").trim() });
  }

  const paragraphText = Array.from(markdown.querySelectorAll("p"))
    .map((p) => (p.textContent ?? "").trim())
    .filter(Boolean);
  for (const text of paragraphText) {
    blocks.push({ type: "paragraph", text });
  }

  if (blocks.length === 0) {
    const text = (markdown.textContent ?? "").trim();
    if (text) blocks.push({ type: "paragraph", text });
  }

  return blocks;
}

function currentConversationId(doc: Document): string {
  const path = doc.location?.pathname || "";
  const match = path.match(/^\/c\/([^/?#]+)/);
  if (match?.[1]) return match[1];

  const active = doc.querySelector<HTMLAnchorElement>(
    `${CHATGPT_SELECTORS.conversationLink}[aria-current='page']`,
  );
  const href = active?.getAttribute("href");
  const fromActive = href?.match(/^\/c\/([^/?#]+)/)?.[1];
  if (fromActive) return fromActive;

  const first = doc.querySelector<HTMLAnchorElement>(CHATGPT_SELECTORS.conversationLink);
  const fromFirst = first?.getAttribute("href")?.match(/^\/c\/([^/?#]+)/)?.[1];
  return fromFirst ?? "unknown";
}

function conversationTitle(doc: Document): string {
  return (
    (doc.querySelector("title")?.textContent ?? "").replace(/\s*[-|].*$/, "").trim() ||
    "제목 없는 대화"
  );
}

function messageOrdinal(doc: Document, message: Element): number {
  const articles = Array.from(doc.querySelectorAll(CHATGPT_SELECTORS.messageArticle));
  const exact = articles.indexOf(message);
  if (exact >= 0) return exact;
  const containing = articles.findIndex((article) => article === message || article.contains(message));
  return containing >= 0 ? containing : 0;
}

/** Capture only the message whose bookmark control the user clicked. */
export function captureMessage(doc: Document, target: BookmarkAnchorTarget): MessageSnapshot {
  const message = target.messageElement;
  const blocks = extractBlocks(message);
  if (blocks.length === 0) throw new Error("저장할 메시지 내용을 찾지 못했습니다");

  const sourceConversationId = currentConversationId(doc);
  const ordinal = messageOrdinal(doc, message);
  const sourceMessageId =
    target.sourceMessageId ?? message.getAttribute(CHATGPT_SELECTORS.messageId) ?? undefined;
  const role = target.role === "unknown" ? roleFromElement(message) : target.role;
  const sourceMessageKey = sourceMessageId
    ? `msg:${sourceMessageId}`
    : `${role}:ordinal:${ordinal}`;

  return {
    sourceConversationId,
    sourceUrl:
      sourceConversationId === "unknown"
        ? doc.location.href
        : `https://chatgpt.com/c/${sourceConversationId}`,
    sourceConversationTitle: conversationTitle(doc),
    ...(sourceMessageId ? { sourceMessageId } : {}),
    sourceMessageKey,
    role,
    messageOrdinal: ordinal,
    capturedAt: new Date().toISOString(),
    blocks,
  };
}

/** Legacy helper retained for migration fixtures; runtime bookmark flow no longer uses it. */
export function captureCurrentConversation(doc: Document): ConversationSnapshot {
  const articles = Array.from(doc.querySelectorAll(CHATGPT_SELECTORS.messageArticle));
  const messages: SnapshotMessage[] = [];

  articles.forEach((article, index) => {
    const sourceMessageId = article.getAttribute(CHATGPT_SELECTORS.messageId) ?? undefined;
    const blocks = extractBlocks(article);
    if (blocks.length === 0) return;
    messages.push({
      ...(sourceMessageId ? { sourceMessageId } : {}),
      role: roleFromElement(article),
      ordinal: index,
      blocks,
    });
  });

  const sourceConversationId = currentConversationId(doc);
  const completeness =
    sourceConversationId !== "unknown" && messages.length > 0 ? "complete" : "partial";

  return {
    sourceConversationId,
    sourceUrl:
      sourceConversationId === "unknown"
        ? doc.location.href
        : `https://chatgpt.com/c/${sourceConversationId}`,
    title: conversationTitle(doc),
    capturedAt: new Date().toISOString(),
    completeness,
    messages,
  };
}
