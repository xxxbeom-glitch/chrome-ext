import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { safeExternalHref } from "../../lib/security/safe-url";

const APP_ROOT = resolve(import.meta.dirname, "../..");

describe("safeExternalHref", () => {
  it("allows http(s) only", () => {
    expect(safeExternalHref("https://chatgpt.com/c/1")).toBe("https://chatgpt.com/c/1");
    expect(safeExternalHref("http://example.com")).toBe("http://example.com/");
    expect(safeExternalHref("javascript:alert(1)")).toBeNull();
    expect(safeExternalHref("data:text/html,hi")).toBeNull();
    expect(safeExternalHref("not a url")).toBeNull();
  });
});

describe("manifest / network destination audit", () => {
  it("keeps permissions aligned with cleanup-only PERMISSIONS.md", () => {
    const config = readFileSync(resolve(APP_ROOT, "wxt.config.ts"), "utf8");
    expect(config).toContain('permissions: ["storage"]');
    expect(config).toContain('host_permissions: ["https://chatgpt.com/*"]');
    expect(config).not.toContain('"identity"');
    expect(config).not.toContain("supabase.co");
    const forbiddenHost = ["<", "all_urls", ">"].join("");
    expect(config).not.toContain(forbiddenHost);
    expect(config).not.toContain("webRequest");
    expect(config).not.toContain('"cookies"');
  });

  it("legacy Supabase prototype source still contains no service-role secret pattern", () => {
    const auth = readFileSync(resolve(APP_ROOT, "lib/supabase/auth.ts"), "utf8");
    const client = readFileSync(resolve(APP_ROOT, "lib/supabase/client.ts"), "utf8");
    const config = readFileSync(resolve(APP_ROOT, "lib/supabase/config.ts"), "utf8");
    for (const source of [auth, client, config]) {
      expect(source.toLowerCase()).not.toContain("service_role");
      expect(source.toLowerCase()).not.toContain("service-role");
    }
  });
});
