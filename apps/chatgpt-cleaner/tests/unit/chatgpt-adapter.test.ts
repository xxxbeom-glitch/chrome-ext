import { describe, expect, it } from "vitest";
import { probeCompatibility } from "../../lib/adapters/chatgpt/compatibility";
import { discoverConversationsFromDom } from "../../lib/adapters/chatgpt/discovery";
import { captureCurrentConversation } from "../../lib/adapters/chatgpt/snapshot";
import {
  injectBookmarkControls,
  locateBookmarkAnchors,
} from "../../lib/adapters/chatgpt/bookmarks";
import {
  CONVERSATION_PAGE_FIXTURE,
  MISSING_SELECTOR_PAGE_FIXTURE,
} from "../fixtures/chatgpt/pages";

function loadFixture(html: string, pathname = "/c/abc-111"): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  // happy-dom/jsdom location is limited; set path via history when available.
  try {
    doc.defaultView?.history?.replaceState({}, "", pathname);
  } catch {
    // ignore
  }
  return doc;
}

describe("chatgpt read adapter", () => {
  it("probes compatibility and discovers conversations without claiming endConfirmed", () => {
    const doc = loadFixture(CONVERSATION_PAGE_FIXTURE);
    const probe = probeCompatibility(doc);
    expect(probe.compatible).toBe(true);
    expect(probe.capabilities.canDiscoverConversations).toBe(true);
    expect(probe.capabilities.canConfirmDiscoveryEnd).toBe(false);
    expect(probe.capabilities.canArchive).toBe(false);
    expect(probe.capabilities.canDelete).toBe(false);

    const page = discoverConversationsFromDom(doc);
    expect(page.items.map((item) => item.sourceId)).toEqual(["abc-111", "abc-222"]);
    expect(page.completeness).toBe("hasMore");
  });

  it("fails closed when selectors are missing", () => {
    const doc = loadFixture(MISSING_SELECTOR_PAGE_FIXTURE);
    const probe = probeCompatibility(doc);
    expect(probe.compatible).toBe(false);
    expect(probe.capabilities.canDiscoverConversations).toBe(false);
    expect(discoverConversationsFromDom(doc).items).toHaveLength(0);
  });

  it("parses structured snapshot blocks and marks unsupported media", () => {
    const doc = loadFixture(CONVERSATION_PAGE_FIXTURE, "/c/abc-111");
    const snapshot = captureCurrentConversation(doc);
    expect(snapshot.messages.length).toBeGreaterThan(0);
    expect(snapshot.messages.filter((message) => message.role === "assistant")).toHaveLength(1);
    const assistant = snapshot.messages.find((message) => message.role === "assistant");
    expect(assistant?.blocks.some((block) => block.type === "code")).toBe(true);
    expect(assistant?.blocks.some((block) => block.type === "unsupported-media")).toBe(true);
    expect(assistant?.blocks.some((block) => block.type === "link")).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain("<script>");
  });

  it("injects bookmark controls idempotently", () => {
    const doc = loadFixture(CONVERSATION_PAGE_FIXTURE);
    expect(locateBookmarkAnchors(doc)).toHaveLength(1);
    const first = injectBookmarkControls(doc, { onBookmark: () => undefined });
    const second = injectBookmarkControls(doc, { onBookmark: () => undefined });
    expect(first.injected).toBe(1);
    expect(second.injected).toBe(0);
    expect(second.skipped).toBe(1);
    expect(doc.querySelectorAll('[data-ce-bookmark-control="true"]')).toHaveLength(1);
    expect(doc.querySelector("[data-ce-bookmark-control='true']")?.getAttribute("aria-label")).toBe(
      "보관함에 저장",
    );
  });
});
