import { describe, expect, it } from "vitest";
import { createRecordingMutationAdapter } from "../../lib/adapters/chatgpt/mutations";
import { createCleanupOverlay } from "../../lib/ui/cleanup-overlay";

describe("cleanup overlay shell", () => {
  it("opens in Shadow DOM and requires delete confirmation before mutating", () => {
    document.body.replaceChildren();
    const mutator = createRecordingMutationAdapter({});
    const overlay = createCleanupOverlay(document, {
      mutator,
      capabilities: mutator.capabilities,
    });
    overlay.open();

    const host = document.querySelector("#ce-chatgpt-cleaner-host");
    expect(host?.shadowRoot).toBeTruthy();
    const shadow = host!.shadowRoot!;
    expect(shadow.textContent).toContain("Clean up conversations");

    const deleteButtons = Array.from(shadow.querySelectorAll("button")).filter(
      (button) => button.textContent === "Delete",
    );
    expect(deleteButtons.length).toBeGreaterThan(0);
    deleteButtons[0]!.click();
    expect(shadow.querySelector("[data-role='confirm']")?.hasAttribute("hidden")).toBe(false);
    expect(mutator.deleteCalls).toEqual([]);

    shadow.querySelector<HTMLButtonElement>("[data-action='confirm-cancel']")!.click();
    expect(mutator.deleteCalls).toEqual([]);
    expect(shadow.textContent).toContain("Delete cancelled");
  });

  it("traps Escape to close without mutating", () => {
    document.body.replaceChildren();
    const mutator = createRecordingMutationAdapter({});
    const overlay = createCleanupOverlay(document, {
      mutator,
      capabilities: mutator.capabilities,
    });
    overlay.open();
    expect(overlay.isOpen()).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(overlay.isOpen()).toBe(false);
    expect(mutator.archiveCalls).toEqual([]);
    expect(mutator.deleteCalls).toEqual([]);
  });
});
