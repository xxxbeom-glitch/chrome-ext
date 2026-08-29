import { describe, expect, it } from "vitest";
import { MOCK_VAULT_DETAILS } from "../../lib/domain/mock-data";
import { renderVaultDetail } from "../../lib/ui/vault-renderer";

describe("vault renderer", () => {
  it("renders structured snapshot content without raw HTML injection", () => {
    const root = document.createElement("div");
    const detail = MOCK_VAULT_DETAILS["vault-1"]!;
    renderVaultDetail(root, detail);

    expect(root.querySelector("h2")?.textContent).toBe(detail.title);
    expect(root.querySelector("code")?.textContent).toContain("attachShadow");
    expect(root.innerHTML).not.toContain("<script>");
  });
});
