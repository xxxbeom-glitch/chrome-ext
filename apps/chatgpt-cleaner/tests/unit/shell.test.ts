import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@chrome-ext/design-system/theme", () => ({
  applyTheme: vi.fn(),
}));

import { applyTheme } from "@chrome-ext/design-system/theme";
import { renderShell } from "../../lib/runtime/shell";

describe("renderShell", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.clearAllMocks();
  });

  it("renders the popup shell without host-page dependencies", () => {
    const root = document.createElement("div");
    document.body.append(root);

    renderShell({ kind: "popup", root, theme: "light" });

    expect(applyTheme).toHaveBeenCalledWith("light", document.documentElement);
    expect(root.querySelector("h1")?.textContent).toBe("ChatGPT Cleaner");
    expect(root.textContent).toContain("Phase 0 · popup");
  });

  it("renders the vault shell", () => {
    const root = document.createElement("div");
    document.body.append(root);

    renderShell({ kind: "vault", root });

    expect(root.querySelector("h1")?.textContent).toBe("Conversation Vault");
    expect(root.textContent).toContain("Phase 0 · vault");
  });
});
