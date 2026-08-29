import { describe, expect, it } from "vitest";
import { probeCompatibility } from "../../lib/adapters/chatgpt/compatibility";
import {
  ASSISTANT_ACTION_ROW_REASON,
  findMoreActionControl,
  findSourcesActionControl,
  locateAssistantActionRows,
} from "../../lib/adapters/chatgpt/dom/action-row";
import { BOOKMARK_COMPAT_ATTR, BOOKMARK_STATUS_ATTR } from "../../lib/adapters/chatgpt/dom/selectors";
import {
  BOOKMARK_LABELS,
  injectBookmarkControls,
  locateBookmarkAnchors,
} from "../../lib/adapters/chatgpt/bookmarks";
import {
  CODE_BLOCK_COPY_ONLY_FIXTURE,
  CONVERSATION_PAGE_FIXTURE,
  CURRENT_COPY_TURN_CLUSTER_FIXTURE,
  LEGACY_ASSISTANT_ACTION_ROW_FIXTURE,
  MISSING_SELECTOR_PAGE_FIXTURE,
  TWO_ASSISTANT_ANSWERS_FIXTURE,
  WRAPPED_ACTION_ROW_FIXTURE,
} from "../fixtures/chatgpt/pages";

function loadFixture(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("assistant action-row locator", () => {
  it("finds the current copy-turn / Message actions cluster", () => {
    const doc = loadFixture(CONVERSATION_PAGE_FIXTURE);
    expect(doc.querySelector('[data-testid="assistant-action-row"]')).toBeNull();
    expect(locateAssistantActionRows(doc)).toHaveLength(1);
    expect(probeCompatibility(doc).capabilities.canLocateAssistantActions).toBe(true);
    expect(doc.documentElement.getAttribute(BOOKMARK_COMPAT_ATTR)).toBe("ok");
  });

  it("still finds the legacy assistant-action-row testid", () => {
    const doc = loadFixture(LEGACY_ASSISTANT_ACTION_ROW_FIXTURE);
    expect(locateAssistantActionRows(doc)).toHaveLength(1);
    expect(injectBookmarkControls(doc, { onBookmark: () => undefined }).injected).toBe(1);
  });

  it("walks up from copy-turn when the cluster is not a named group", () => {
    const doc = loadFixture(CURRENT_COPY_TURN_CLUSTER_FIXTURE);
    const rows = locateAssistantActionRows(doc);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.querySelector('[data-testid="copy-turn-action-button"]')).not.toBeNull();
  });

  it("does not treat a code-block copy button as an action row", () => {
    const doc = loadFixture(CODE_BLOCK_COPY_ONLY_FIXTURE);
    expect(locateAssistantActionRows(doc)).toHaveLength(0);
    const probe = probeCompatibility(doc);
    expect(probe.capabilities.canLocateAssistantActions).toBe(false);
    expect(probe.reasons).toContain(ASSISTANT_ACTION_ROW_REASON);
    expect(doc.documentElement.getAttribute(BOOKMARK_COMPAT_ATTR)).toBe("missing-action-row");
  });

  it("records a missing-action-row diagnostic when no cluster exists", () => {
    const doc = loadFixture(MISSING_SELECTOR_PAGE_FIXTURE);
    const probe = probeCompatibility(doc);
    expect(probe.capabilities.canLocateAssistantActions).toBe(false);
    expect(probe.reasons).toContain(ASSISTANT_ACTION_ROW_REASON);
    expect(doc.documentElement.getAttribute(BOOKMARK_COMPAT_ATTR)).toBe("missing-action-row");
  });
});

describe("bookmark action injection", () => {
  it("injects exactly one control per assistant answer", () => {
    const doc = loadFixture(TWO_ASSISTANT_ANSWERS_FIXTURE);
    expect(locateBookmarkAnchors(doc)).toHaveLength(2);
    const first = injectBookmarkControls(doc, { onBookmark: () => undefined });
    const second = injectBookmarkControls(doc, { onBookmark: () => undefined });
    expect(first.injected).toBe(2);
    expect(second.injected).toBe(0);
    expect(second.skipped).toBe(2);
    expect(doc.querySelectorAll('[data-ce-bookmark-control="true"]')).toHaveLength(2);
    expect(locateBookmarkAnchors(doc).map((target) => target.sourceMessageId)).toEqual(["a1", "a2"]);
  });

  it("inserts the control after 더보기 and before 출처", () => {
    const doc = loadFixture(WRAPPED_ACTION_ROW_FIXTURE);
    injectBookmarkControls(doc, { onBookmark: () => undefined });
    const row = locateAssistantActionRows(doc)[0];
    expect(row).toBeTruthy();
    if (!row) throw new Error("expected action row");

    const more = findMoreActionControl(row);
    const sources = findSourcesActionControl(row);
    const bookmark = row.querySelector("[data-ce-bookmark-control='true']");
    expect(more).toBeTruthy();
    expect(sources).toBeTruthy();
    expect(bookmark).toBeTruthy();
    if (!more || !sources || !bookmark) throw new Error("expected controls");

    const children = Array.from(row.children);
    const moreChild = children.find((child) => child.contains(more));
    const bookmarkIndex = children.indexOf(bookmark);
    const sourcesChild = children.find((child) => child.contains(sources));
    expect(moreChild).toBeTruthy();
    expect(sourcesChild).toBeTruthy();
    expect(bookmarkIndex).toBeGreaterThan(children.indexOf(moreChild as Element));
    expect(bookmarkIndex).toBeLessThan(children.indexOf(sourcesChild as Element));
  });

  it("uses a bookmark icon button with Korean idle label", () => {
    const doc = loadFixture(CONVERSATION_PAGE_FIXTURE);
    injectBookmarkControls(doc, { onBookmark: () => undefined });
    const button = doc.querySelector<HTMLButtonElement>("[data-ce-bookmark-control='true']");
    expect(button).toBeTruthy();
    expect(button?.getAttribute("aria-label")).toBe(BOOKMARK_LABELS.idle);
    expect(button?.title).toBe(BOOKMARK_LABELS.idle);
    expect(button?.querySelector("svg")).not.toBeNull();
    expect(button?.textContent?.trim()).toBe("");
  });

  it("exposes saving / saved / retry states on the same control", () => {
    const doc = loadFixture(CONVERSATION_PAGE_FIXTURE);
    let handle: { setStatus: (status: "saving" | "saved" | "failed") => void } | undefined;
    injectBookmarkControls(doc, {
      onBookmark: (_target, control) => {
        handle = control;
      },
    });
    const button = doc.querySelector<HTMLButtonElement>("[data-ce-bookmark-control='true']");
    expect(button).toBeTruthy();
    if (!button) throw new Error("expected bookmark button");

    button.click();
    expect(handle).toBeTruthy();
    handle?.setStatus("saving");
    expect(button.getAttribute("aria-label")).toBe(BOOKMARK_LABELS.saving);
    expect(button.getAttribute(BOOKMARK_STATUS_ATTR)).toBe("saving");
    expect(button.disabled).toBe(true);

    handle?.setStatus("saved");
    expect(button.getAttribute("aria-label")).toBe(BOOKMARK_LABELS.saved);
    expect(button.disabled).toBe(false);

    handle?.setStatus("failed");
    expect(button.getAttribute("aria-label")).toBe(BOOKMARK_LABELS.failed);
    expect(button.disabled).toBe(false);
  });

  it("does not bubble the bookmark click to ChatGPT row handlers", () => {
    const doc = loadFixture(CONVERSATION_PAGE_FIXTURE);
    const row = locateAssistantActionRows(doc)[0];
    expect(row).toBeTruthy();
    let rowClicks = 0;
    row?.addEventListener("click", () => {
      rowClicks += 1;
    });

    let bookmarkClicks = 0;
    injectBookmarkControls(doc, {
      onBookmark: () => {
        bookmarkClicks += 1;
      },
    });
    doc.querySelector<HTMLButtonElement>("[data-ce-bookmark-control='true']")?.click();
    expect(bookmarkClicks).toBe(1);
    expect(rowClicks).toBe(0);
  });
});
