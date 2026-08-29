import { describe, expect, it } from "vitest";
import { renderVaultDetail } from "../../lib/ui/vault-renderer";
import type { VaultConversationDetail } from "../../lib/domain/types";

describe("vault renderer hardening", () => {
  it("renders structured snapshot content without raw HTML injection", () => {
    const root = document.createElement("div");
    const detail: VaultConversationDetail = {
      id: "v1",
      title: "Safe title",
      sourceConversationId: "c1",
      updatedAt: "2026-08-29T00:00:00.000Z",
      bookmarkCount: 0,
      completeness: "complete",
      messages: [
        {
          ordinal: 0,
          role: "assistant",
          blocks: [
            { type: "paragraph", text: '<script>alert("x")</script>' },
            { type: "code", text: "attachShadow({ mode: 'open' })", language: "js" },
            { type: "link", href: "javascript:alert(1)", label: "evil" },
            { type: "link", href: "https://example.com/ok", label: "ok" },
          ],
        },
      ],
      anchors: [],
      sourceUrl: "javascript:alert(2)",
    };

    renderVaultDetail(root, detail);

    expect(root.querySelector("h2")?.textContent).toBe("Safe title");
    expect(root.querySelector("script")).toBeNull();
    expect(root.innerHTML).not.toContain("<script>");
    expect(root.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(root.querySelector('a[href="https://example.com/ok"]')?.textContent).toBe("ok");
    expect(root.textContent).toContain('<script>alert("x")</script>');
    expect(root.textContent).toContain("evil");
  });
});
