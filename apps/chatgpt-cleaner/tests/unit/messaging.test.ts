import { describe, expect, it } from "vitest";
import { isExtensionMessage, MESSAGE_VERSION } from "../../lib/messaging/schema";

describe("extension message schema", () => {
  it("accepts known popup/background commands", () => {
    expect(
      isExtensionMessage({ version: MESSAGE_VERSION, type: "tabs.openChatgpt", openCleanup: true }),
    ).toBe(true);
    expect(isExtensionMessage({ version: MESSAGE_VERSION, type: "cleanup.open" })).toBe(true);
  });

  it("rejects malformed payloads", () => {
    expect(isExtensionMessage({ type: "cleanup.open" })).toBe(false);
    expect(isExtensionMessage({ version: MESSAGE_VERSION, type: "nope" })).toBe(false);
    expect(isExtensionMessage({ version: MESSAGE_VERSION, type: "cleanup.status" })).toBe(false);
  });
});
