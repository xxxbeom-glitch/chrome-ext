import { describe, expect, it, vi } from "vitest";
import type { ConversationSnapshot } from "../../lib/adapters/chatgpt/types";
import { LocalVaultRepository } from "../../lib/domain/vault/local-repository";
import { createVaultService } from "../../lib/domain/vault/service";

function snap(completeness: "complete" | "partial" = "complete"): ConversationSnapshot {
  return {
    sourceConversationId: "c1",
    sourceUrl: "https://chatgpt.com/c/c1",
    title: "T",
    capturedAt: "2026-08-29T00:00:00.000Z",
    completeness,
    messages: [{ ordinal: 0, role: "assistant", blocks: [{ type: "paragraph", text: "hi" }] }],
  };
}

describe("vault service routing", () => {
  it("saves to local when cloud is unavailable", async () => {
    const local = new LocalVaultRepository();
    const cloudSave = vi.fn();
    const service = createVaultService({
      useCloud: async () => false,
      cloud: { saveSnapshot: cloudSave, list: async () => [], deleteVaultOnly: async () => false } as never,
      loadLocal: async () => local,
      persistLocal: async () => undefined,
    });

    const result = await service.saveSnapshot({
      snapshot: snap(),
      anchor: { messageOrdinal: 0, excerpt: "hi" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.backend).toBe("local");
    expect(cloudSave).not.toHaveBeenCalled();
    expect(local.list()).toHaveLength(1);
  });

  it("routes to cloud when signed in and surfaces cloud failures", async () => {
    const cloudSave = vi.fn(async () => ({
      ok: false as const,
      error: "network down",
      preservedExisting: true,
    }));
    const service = createVaultService({
      useCloud: async () => true,
      cloud: {
        saveSnapshot: cloudSave,
        list: async () => [],
        deleteVaultOnly: async () => false,
      } as never,
      loadLocal: async () => new LocalVaultRepository(),
      persistLocal: async () => undefined,
    });

    const result = await service.saveSnapshot({
      snapshot: snap(),
      anchor: { messageOrdinal: 0, excerpt: "hi" },
    });
    expect(result).toMatchObject({
      ok: false,
      backend: "cloud",
      error: "network down",
      preservedExisting: true,
    });
    expect(cloudSave).toHaveBeenCalledOnce();
  });

  it("lists cloud records when signed in", async () => {
    const service = createVaultService({
      useCloud: async () => true,
      cloud: {
        list: async () => [
          {
            id: "v1",
            sourceConversationId: "c1",
            title: "Cloud",
            snapshot: snap(),
            completeness: "complete",
            messageCount: 1,
            capturedAt: "2026-08-29T00:00:00.000Z",
            createdAt: "2026-08-29T00:00:00.000Z",
            updatedAt: "2026-08-29T00:00:00.000Z",
            bookmarks: [],
          },
        ],
        saveSnapshot: async () => ({ ok: false, error: "n/a", preservedExisting: true }),
        deleteVaultOnly: async () => false,
      } as never,
    });
    expect(await service.backend()).toBe("cloud");
    expect((await service.list())[0]?.title).toBe("Cloud");
  });
});
