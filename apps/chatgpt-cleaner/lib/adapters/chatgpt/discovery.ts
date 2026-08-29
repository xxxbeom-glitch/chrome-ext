import { CHATGPT_SELECTORS } from "./dom/selectors";
import type { DiscoveryPage, DiscoveredConversation } from "./types";

function conversationIdFromHref(href: string): string | null {
  try {
    const url = new URL(href, "https://chatgpt.com");
    const match = url.pathname.match(/^\/c\/([^/?#]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function discoverConversationsFromDom(doc: Document): DiscoveryPage {
  const items: DiscoveredConversation[] = [];
  const seen = new Set<string>();

  for (const anchor of Array.from(doc.querySelectorAll<HTMLAnchorElement>(CHATGPT_SELECTORS.conversationLink))) {
    const sourceId = conversationIdFromHref(anchor.getAttribute("href") ?? "");
    if (!sourceId || seen.has(sourceId)) continue;
    seen.add(sourceId);

    const title = (anchor.textContent ?? "").trim() || `대화 ${sourceId.slice(0, 8)}`;
    items.push({
      sourceId,
      title,
      sourceUrl: `https://chatgpt.com/c/${sourceId}`,
    });
  }

  return {
    items,
    // Visible DOM history is never treated as endConfirmed.
    completeness: items.length > 0 ? "hasMore" : "unknown",
  };
}
