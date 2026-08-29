import { describe, expect, it } from "vitest";
import { captureMessage } from "../../lib/adapters/chatgpt/snapshot";
import {
  injectBookmarkControls,
  locateBookmarkAnchors,
} from "../../lib/adapters/chatgpt/bookmarks";

const PAGE = `
<!doctype html>
<html>
  <head><title>Independent bookmarks - ChatGPT</title></head>
  <body>
    <article data-testid="conversation-turn-1" data-turn="user">
      <div data-message-author-role="user" data-message-id="u1">
        <div class="markdown"><p>Save only this question.</p></div>
      </div>
      <div role="group" aria-label="Message actions">
        <button data-testid="copy-turn-action-button" aria-label="복사">복사</button>
        <button aria-label="더보기">...</button>
      </div>
    </article>
    <article data-testid="conversation-turn-2" data-turn="assistant">
      <div data-message-author-role="assistant" data-message-id="a1">
        <div class="markdown"><p>Save only this answer.</p><pre><code class="language-ts">const a = 1;</code></pre></div>
      </div>
      <div role="group" aria-label="Message actions">
        <button data-testid="copy-turn-action-button" aria-label="복사">복사</button>
        <button aria-label="더보기">...</button>
      </div>
    </article>
  </body>
</html>`;

function doc(): Document {
  const parsed = new DOMParser().parseFromString(PAGE, "text/html");
  try {
    parsed.defaultView?.history?.replaceState({}, "", "/c/c1");
  } catch {
    // fixture environment may not support location mutation
  }
  return parsed;
}

describe("message-level bookmark capture", () => {
  it("locates both a user question and an assistant answer", () => {
    const parsed = doc();
    const targets = locateBookmarkAnchors(parsed);
    expect(targets.map((target) => target.role)).toEqual(["user", "assistant"]);
    expect(targets.map((target) => target.sourceMessageId)).toEqual(["u1", "a1"]);

    const result = injectBookmarkControls(parsed, { onBookmark: () => undefined });
    expect(result.injected).toBe(2);
    expect(parsed.querySelectorAll('[data-ce-bookmark-control="true"]')).toHaveLength(2);
  });

  it("captures only the selected question", () => {
    const parsed = doc();
    const target = locateBookmarkAnchors(parsed).find((item) => item.role === "user");
    expect(target).toBeTruthy();
    if (!target) return;
    const snapshot = captureMessage(parsed, target);

    expect(snapshot.role).toBe("user");
    expect(snapshot.sourceMessageKey).toBe("msg:u1");
    expect(snapshot.blocks).toEqual([{ type: "paragraph", text: "Save only this question." }]);
    expect(JSON.stringify(snapshot)).not.toContain("Save only this answer");
  });

  it("captures only the selected answer while preserving its code block", () => {
    const parsed = doc();
    const target = locateBookmarkAnchors(parsed).find((item) => item.role === "assistant");
    expect(target).toBeTruthy();
    if (!target) return;
    const snapshot = captureMessage(parsed, target);

    expect(snapshot.role).toBe("assistant");
    expect(snapshot.sourceMessageKey).toBe("msg:a1");
    expect(snapshot.blocks.some((block) => block.type === "code")).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain("Save only this question");
  });
});
