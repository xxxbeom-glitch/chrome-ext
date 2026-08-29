import { describe, expect, it } from "vitest";
import { readSupabasePublicConfig } from "../../lib/supabase/config";
import { createCloudVaultRepository } from "../../lib/supabase/vault-repository";

describe("supabase config and cloud vault boundary", () => {
  it("returns null when public env is missing", () => {
    expect(readSupabasePublicConfig({})).toBeNull();
  });

  it("rejects non-supabase hosts", () => {
    expect(() =>
      readSupabasePublicConfig({
        VITE_SUPABASE_URL: "https://evil.example.com",
        VITE_SUPABASE_ANON_KEY: "anon",
      }),
    ).toThrow(/supabase\.co/);
  });

  it("accepts exact project host config", () => {
    expect(
      readSupabasePublicConfig({
        VITE_SUPABASE_URL: "https://sgdoskwhwenyugkljzyk.supabase.co",
        VITE_SUPABASE_ANON_KEY: "anon-test",
      }),
    ).toEqual({
      url: "https://sgdoskwhwenyugkljzyk.supabase.co",
      anonKey: "anon-test",
    });
  });

  it("fail-softs cloud saves when unconfigured", async () => {
    const repo = createCloudVaultRepository(false);
    const result = await repo.saveSnapshot({
      snapshot: {
        sourceConversationId: "c1",
        sourceUrl: "https://chatgpt.com/c/c1",
        title: "t",
        capturedAt: "2026-08-29T00:00:00.000Z",
        completeness: "complete",
        messages: [],
      },
      anchor: { messageOrdinal: 0, excerpt: "x" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.preservedExisting).toBe(true);
  });
});
