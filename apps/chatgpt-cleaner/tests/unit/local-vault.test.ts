import { describe, expect, it } from "vitest";
import type { ConversationSnapshot } from "../../lib/adapters/chatgpt/types";
import { LocalVaultRepository } from "../../lib/domain/vault/local-repository";

function snapshot(
  overrides: Partial<ConversationSnapshot> & Pick<ConversationSnapshot, "sourceConversationId" | "completeness">,
): ConversationSnapshot {
  return {
    sourceConversationId: overrides.sourceConversationId,
    sourceUrl: overrides.sourceUrl ?? `https://chatgpt.com/c/${overrides.sourceConversationId}`,
    title: overrides.title ?? "Title",
    capturedAt: overrides.capturedAt ?? "2026-08-29T00:00:00.000Z",
    completeness: overrides.completeness,
    messages: overrides.messages ?? [
      {
        ordinal: 0,
        role: "assistant",
        blocks: [{ type: "paragraph", text: "hello" }],
      },
    ],
  };
}

describe("local vault repository", () => {
  it("upserts one record per source conversation and preserves multiple anchors", () => {
    const repo = new LocalVaultRepository();
    const first = repo.saveSnapshot({
      snapshot: snapshot({ sourceConversationId: "c1", completeness: "complete" }),
      anchor: { messageOrdinal: 0, excerpt: "first", sourceMessageId: "m0" },
    });
    const second = repo.saveSnapshot({
      snapshot: snapshot({
        sourceConversationId: "c1",
        completeness: "complete",
        title: "Updated",
        messages: [
          { ordinal: 0, role: "user", blocks: [{ type: "paragraph", text: "q" }] },
          { ordinal: 1, role: "assistant", blocks: [{ type: "paragraph", text: "a" }] },
        ],
      }),
      anchor: { messageOrdinal: 1, excerpt: "second", sourceMessageId: "m1" },
    });

    expect(first.ok && second.ok).toBe(true);
    expect(repo.list()).toHaveLength(1);
    const record = repo.getBySource("c1");
    expect(record?.title).toBe("Updated");
    expect(record?.bookmarks).toHaveLength(2);
  });

  it("prevents duplicate anchors", () => {
    const repo = new LocalVaultRepository();
    repo.saveSnapshot({
      snapshot: snapshot({ sourceConversationId: "c1", completeness: "complete" }),
      anchor: { messageOrdinal: 0, excerpt: "first", sourceMessageId: "m0" },
    });
    repo.saveSnapshot({
      snapshot: snapshot({ sourceConversationId: "c1", completeness: "complete" }),
      anchor: { messageOrdinal: 0, excerpt: "again", sourceMessageId: "m0" },
    });
    expect(repo.getBySource("c1")?.bookmarks).toHaveLength(1);
  });

  it("does not let partial capture replace a complete snapshot", () => {
    const repo = new LocalVaultRepository();
    repo.saveSnapshot({
      snapshot: snapshot({ sourceConversationId: "c1", completeness: "complete", title: "Complete" }),
      anchor: { messageOrdinal: 0, excerpt: "first", sourceMessageId: "m0" },
    });
    const result = repo.saveSnapshot({
      snapshot: snapshot({ sourceConversationId: "c1", completeness: "partial", title: "Partial" }),
      anchor: { messageOrdinal: 1, excerpt: "partial", sourceMessageId: "m1" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.preservedExisting).toBe(true);
    expect(repo.getBySource("c1")?.title).toBe("Complete");
    expect(repo.getBySource("c1")?.bookmarks).toHaveLength(1);
  });

  it("deletes Vault records without needing a ChatGPT source", () => {
    const repo = new LocalVaultRepository();
    const saved = repo.saveSnapshot({
      snapshot: snapshot({ sourceConversationId: "c1", completeness: "complete" }),
      anchor: { messageOrdinal: 0, excerpt: "first" },
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(repo.deleteVaultOnly(saved.record.id)).toBe(true);
    expect(repo.list()).toHaveLength(0);
  });
});
