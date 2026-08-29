import { describe, expect, it } from "vitest";
import type { MessageSnapshot } from "../../lib/adapters/chatgpt/types";
import { LocalVaultRepository } from "../../lib/domain/vault/local-repository";

function item(overrides: Partial<MessageSnapshot> = {}): MessageSnapshot {
  return {
    sourceConversationId: overrides.sourceConversationId ?? "c1",
    sourceUrl: overrides.sourceUrl ?? "https://chatgpt.com/c/c1",
    sourceConversationTitle: overrides.sourceConversationTitle ?? "Conversation",
    sourceMessageId: overrides.sourceMessageId ?? "m1",
    sourceMessageKey: overrides.sourceMessageKey ?? "msg:m1",
    role: overrides.role ?? "assistant",
    messageOrdinal: overrides.messageOrdinal ?? 1,
    capturedAt: overrides.capturedAt ?? "2026-08-29T00:00:00.000Z",
    blocks: overrides.blocks ?? [{ type: "paragraph", text: "answer one" }],
  };
}

describe("local message Vault repository", () => {
  it("stores different messages in one conversation as independent items", () => {
    const repo = new LocalVaultRepository();
    repo.saveItem(item({ sourceMessageId: "m1", sourceMessageKey: "msg:m1", messageOrdinal: 1 }));
    repo.saveItem(
      item({
        sourceMessageId: "m2",
        sourceMessageKey: "msg:m2",
        messageOrdinal: 2,
        role: "user",
        blocks: [{ type: "paragraph", text: "question two" }],
      }),
    );
    repo.saveItem(
      item({
        sourceMessageId: "m3",
        sourceMessageKey: "msg:m3",
        messageOrdinal: 3,
        blocks: [{ type: "paragraph", text: "answer three" }],
      }),
    );

    expect(repo.list()).toHaveLength(3);
    expect(repo.getBySourceMessage("c1", "msg:m2")?.role).toBe("user");
  });

  it("deduplicates re-saving the same source message", () => {
    const repo = new LocalVaultRepository();
    const first = repo.saveItem(item());
    const second = repo.saveItem(item({ blocks: [{ type: "paragraph", text: "updated content" }] }));

    expect(first.ok && second.ok).toBe(true);
    expect(repo.list()).toHaveLength(1);
    if (second.ok) {
      expect(second.deduplicated).toBe(true);
      expect(second.record.blocks).toEqual([{ type: "paragraph", text: "updated content" }]);
    }
  });

  it("allows equal message keys in different conversations", () => {
    const repo = new LocalVaultRepository();
    repo.saveItem(item({ sourceConversationId: "c1", sourceMessageKey: "msg:same" }));
    repo.saveItem(
      item({
        sourceConversationId: "c2",
        sourceUrl: "https://chatgpt.com/c/c2",
        sourceMessageKey: "msg:same",
      }),
    );
    expect(repo.list()).toHaveLength(2);
  });

  it("deletes a Vault item without touching a ChatGPT source", () => {
    const repo = new LocalVaultRepository();
    const saved = repo.saveItem(item());
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(repo.deleteVaultOnly(saved.record.id)).toBe(true);
    expect(repo.list()).toHaveLength(0);
  });
});
