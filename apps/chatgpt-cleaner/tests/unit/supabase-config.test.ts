import { describe, expect, it, vi, beforeEach } from "vitest";
import { readSupabasePublicConfig } from "../../lib/supabase/config";

describe("supabase public config", () => {
  it("returns null when public env is missing", () => {
    expect(readSupabasePublicConfig({})).toBeNull();
  });

  it("rejects non-supabase hosts", () => {
    expect(() =>
      readSupabasePublicConfig({
        WXT_PUBLIC_SUPABASE_URL: "https://evil.example.com",
        WXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      }),
    ).toThrow(/supabase\.co/);
  });

  it("accepts exact project host config with WXT_PUBLIC_ names", () => {
    expect(
      readSupabasePublicConfig({
        WXT_PUBLIC_SUPABASE_URL: "https://sgdoskwhwenyugkljzyk.supabase.co",
        WXT_PUBLIC_SUPABASE_ANON_KEY: "anon-test",
      }),
    ).toEqual({
      url: "https://sgdoskwhwenyugkljzyk.supabase.co",
      anonKey: "anon-test",
    });
  });
});

describe("PKCE auth helpers", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("startGoogleSignIn fails soft when config is missing", async () => {
    vi.doMock("../../lib/supabase/config", () => ({
      readSupabasePublicConfig: () => null,
    }));
    vi.doMock("../../lib/supabase/client", () => ({
      getSupabaseClient: () => null,
    }));
    const { startGoogleSignIn } = await import("../../lib/supabase/auth");
    const result = await startGoogleSignIn();
    expect(result).toEqual({ ok: false, error: "Supabase public config is missing" });
  });
});
