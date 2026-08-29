export const CONTENT_MARKER_ATTRIBUTE = "data-ce-chatgpt-cleaner" as const;

export function markContentScriptLoaded(doc: Document): HTMLElement {
  const existing = doc.documentElement;
  existing.setAttribute(CONTENT_MARKER_ATTRIBUTE, "loaded");
  return existing;
}

export function isContentScriptMarked(doc: Document): boolean {
  return doc.documentElement.getAttribute(CONTENT_MARKER_ATTRIBUTE) === "loaded";
}
