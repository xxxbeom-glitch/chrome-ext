import { describe, expect, it, vi } from "vitest";
import {
  bookmarkKey,
  shouldRejectPartialOverwrite,
  SupabaseCloudVaultRepository,
} from "../../lib/supabase/cloud-vault-repository";
import type { ConversationSnapshot } from "../../lib/adapters/chatgpt/types";

function snap(completeness: "complete" | "partial"): ConversationSnapshot {
  return {
    sourceConversationId: "c1",
    sourceUrl: "https://chatgpt.com/c/c1",
    title: "T",
    capturedAt: "2026-08-29T00:00:00.000Z",
    completeness,
    messages: [{ ordinal: 0, role: "assistant", blocks: [{ type: "paragraph", text: "hi" }] }],
  };
}

describe("cloud vault guards", () => {
  it("builds stable bookmark keys", () => {
    expect(bookmarkKey({ sourceMessageId: "m1", messageOrdinal: 3 })).toBe("msg:m1");
    expect(bookmarkKey({ messageOrdinal: 2, anchorKey: "ordinal:2" })).toBe("ordinal:2");
  });

  it("never allows partial to replace complete", () => {
    expect(shouldRejectPartialOverwrite("complete", "partial")).toBe(true);
    expect(shouldRejectPartialOverwrite("complete", "complete")).toBe(false);
    expect(shouldRejectPartialOverwrite(undefined, "partial")).toBe(false);
  });
});

describe("SupabaseCloudVaultRepository", () => {
  it("returns failure without mutating when unsigned", async () => {
    const repo = new SupabaseCloudVaultRepository({
      getClient: () => ({}) as never,
      getSession: async () => ({ status: "signed_out" }),
    });
    const result = await repo.saveSnapshot({
      snapshot: snap("complete"),
      anchor: { messageOrdinal: 0, excerpt: "x" },
    });
    expect(result).toEqual({
      ok: false,
      error: "Supabase가 설정되지 않았거나 로그아웃 상태입니다",
      preservedExisting: true,
    });
  });

  it("skips upsert when partial would overwrite complete", async () => {
    const upsert = vi.fn();
    const repo = new SupabaseCloudVaultRepository({
      getSession: async () => ({ status: "signed_in", userId: "u1" }),
      getClient: () =>
        ({
          from: () => ({
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: {
                      id: "v1",
                      completeness: "complete",
                      source_conversation_id: "c1",
                    },
                    error: null,
                  }),
                }),
              }),
            }),
            upsert,
          }),
        }) as never,
    });

    const result = await repo.saveSnapshot({
      snapshot: snap("partial"),
      anchor: { messageOrdinal: 0, excerpt: "x" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.preservedExisting).toBe(true);
    expect(upsert).not.toHaveBeenCalled();
  });
});
