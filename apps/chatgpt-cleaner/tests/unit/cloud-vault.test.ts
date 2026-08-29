import { describe, expect, it, vi } from "vitest";
import { SupabaseCloudVaultRepository } from "../../lib/supabase/cloud-vault-repository";
import type { MessageSnapshot } from "../../lib/adapters/chatgpt/types";

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

describe("SupabaseCloudVaultRepository", () => {
  it("returns failure without mutating when unsigned", async () => {
    const repo = new SupabaseCloudVaultRepository({
      getClient: () => ({}) as never,
      getSession: async () => ({ status: "signed_out" }),
    });
    const result = await repo.saveItem(item());
    expect(result).toEqual({
      ok: false,
      error: "Supabase가 설정되지 않았거나 로그아웃 상태입니다",
      preservedExisting: true,
    });
  });

  it("upserts by user + conversation + message key", async () => {
    const single = vi.fn(async () => ({
      data: {
        id: "v1",
        user_id: "u1",
        source_conversation_id: "c1",
        source_url: "https://chatgpt.com/c/c1",
        source_conversation_title: "T",
        source_message_id: "m1",
        source_message_key: "msg:m1",
        role: "assistant",
        message_ordinal: 1,
        content: [{ type: "paragraph", text: "hi" }],
        captured_at: "2026-08-29T00:00:00.000Z",
        created_at: "2026-08-29T00:00:00.000Z",
        updated_at: "2026-08-29T00:00:00.000Z",
      },
      error: null,
    }));
    const upsert = vi.fn(() => ({ select: () => ({ single }) }));
    const maybeSingle = vi.fn(async () => ({ data: null, error: null }));
    const from = vi.fn(() => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle }),
          }),
        }),
      }),
      upsert,
    }));

    const repo = new SupabaseCloudVaultRepository({
      getSession: async () => ({ status: "signed_in", userId: "u1" }),
      getClient: () => ({ from }) as never,
    });
    const result = await repo.saveItem(item());

    expect(result.ok).toBe(true);
    expect(from).toHaveBeenCalledWith("vault_items");
    expect(upsert).toHaveBeenCalledOnce();
    expect(upsert.mock.calls[0]?.[1]).toEqual({
      onConflict: "user_id,source_conversation_id,source_message_key",
    });
    if (result.ok) expect(result.deduplicated).toBe(false);
  });
});
