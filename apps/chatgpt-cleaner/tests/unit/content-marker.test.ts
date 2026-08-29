import { describe, expect, it } from "vitest";
import {
  CONTENT_MARKER_ATTRIBUTE,
  isContentScriptMarked,
  markContentScriptLoaded,
} from "../../lib/runtime/content-marker";

describe("content marker", () => {
  it("marks the document root once for ChatGPT content-script presence", () => {
    const doc = document.implementation.createHTMLDocument("fixture");
    markContentScriptLoaded(doc);
    expect(doc.documentElement.getAttribute(CONTENT_MARKER_ATTRIBUTE)).toBe("loaded");
    expect(isContentScriptMarked(doc)).toBe(true);
  });

  it("is idempotent when called again", () => {
    const doc = document.implementation.createHTMLDocument("fixture");
    markContentScriptLoaded(doc);
    markContentScriptLoaded(doc);
    expect(doc.documentElement.getAttribute(CONTENT_MARKER_ATTRIBUTE)).toBe("loaded");
  });
});
