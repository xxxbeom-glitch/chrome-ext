import { describe, expect, it } from "vitest";
import { createCleanupOverlay } from "../../lib/ui/cleanup-overlay";

describe("cleanup overlay shell", () => {
  it("opens in Shadow DOM and exposes archive/delete affordances without mutating host", () => {
    document.body.replaceChildren();
    const overlay = createCleanupOverlay(document);
    overlay.open();

    const host = document.querySelector("#ce-chatgpt-cleaner-host");
    expect(host?.shadowRoot).toBeTruthy();
    const dialog = host?.shadowRoot?.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(host?.shadowRoot?.textContent).toContain("Clean up conversations");
    expect(host?.shadowRoot?.textContent).toContain("Archive");
    expect(host?.shadowRoot?.textContent).toContain("Delete");
    expect(host?.shadowRoot?.textContent).toContain("more available");

    overlay.close();
    expect(host?.shadowRoot?.querySelector(".ce-overlay-root")?.hasAttribute("hidden")).toBe(true);
  });
});
