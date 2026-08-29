import { describe, expect, it, vi } from "vitest";
import type { MessageSnapshot } from "../../lib/adapters/chatgpt/types";
import { LocalVaultRepository } from "../../lib/domain/vault/local-repository";
import { createVaultService } from "../../lib/domain/vault/service";

function item(): MessageSnapshot {
  return {
    sourceConversationId: "c1",
    sourceUrl: "https://chatgpt.com/c/c1",
    sourceConversationTitle: "T",
    sourceMessageId: "m1",
    sourceMessageKey: "msg:m1",
    role: "assistant",
    messageOrdinal: 1,
    capturedAt: "2026-08-29T00:00:00.000Z",
    blocks: [{ type: "paragraph", text: "hi" }],
  };
}

describe("vault service routing", () => {
  it("saves one item locally when cloud is unavailable", async () => {
    const local = new LocalVaultRepository();
    const cloudSave = vi.fn();
    const service = createVaultService({
      useCloud: async () => false,
      cloud: { saveItem: cloudSave, list: async () => [], deleteVaultOnly: async () => false } as never,
      loadLocal: async () => local,
      persistLocal: async () => undefined,
    });

    const result = await service.saveItem(item());
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
        saveItem: cloudSave,
        list: async () => [],
        deleteVaultOnly: async () => false,
      } as never,
      loadLocal: async () => new LocalVaultRepository(),
      persistLocal: async () => undefined,
    });

    const result = await service.saveItem(item());
    expect(result).toMatchObject({
      ok: false,
      backend: "cloud",
      error: "network down",
      preservedExisting: true,
    });
    expect(cloudSave).toHaveBeenCalledOnce();
  });

  it("lists independent cloud records", async () => {
    const service = createVaultService({
      useCloud: async () => true,
      cloud: {
        list: async () => [
          {
            id: "v1",
            sourceConversationId: "c1",
            sourceUrl: "https://chatgpt.com/c/c1",
            sourceConversationTitle: "Cloud",
            sourceMessageId: "m1",
            sourceMessageKey: "msg:m1",
            role: "assistant",
            messageOrdinal: 1,
            blocks: [{ type: "paragraph", text: "saved answer" }],
            capturedAt: "2026-08-29T00:00:00.000Z",
            createdAt: "2026-08-29T00:00:00.000Z",
            updatedAt: "2026-08-29T00:00:00.000Z",
          },
        ],
        saveItem: async () => ({ ok: false, error: "n/a", preservedExisting: true }),
        deleteVaultOnly: async () => false,
      } as never,
    });
    expect(await service.backend()).toBe("cloud");
    expect((await service.list())[0]?.sourceConversationTitle).toBe("Cloud");
  });
});
