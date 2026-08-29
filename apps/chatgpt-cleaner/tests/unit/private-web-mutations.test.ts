import { describe, expect, it, vi } from "vitest";
import { createPrivateWebMutationAdapter } from "../../lib/adapters/chatgpt/mutations";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("private-web ChatGPT mutations", () => {
  it("archives with is_archived=true and deletes with is_visible=false", async () => {
    const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
      if (input === "/api/auth/session") return jsonResponse({ accessToken: "token-1" });
      expect(input).toBe("/backend-api/conversation/c1");
      expect(init?.method).toBe("PATCH");
      expect((init?.headers as Record<string, string>).authorization).toBe("Bearer token-1");
      return jsonResponse({ success: true });
    });
    const adapter = createPrivateWebMutationAdapter({ fetchImpl });

    await adapter.archive("c1");
    expect(JSON.parse(String(fetchImpl.mock.calls[1]?.[1]?.body))).toEqual({ is_archived: true });

    await adapter.delete("c1");
    expect(JSON.parse(String(fetchImpl.mock.calls[2]?.[1]?.body))).toEqual({ is_visible: false });
    expect(fetchImpl.mock.calls.filter(([url]) => url === "/api/auth/session")).toHaveLength(1);
  });

  it("does not hide failures or automatically retry a destructive PATCH", async () => {
    const fetchImpl = vi.fn(async (input: string) => {
      if (input === "/api/auth/session") return jsonResponse({ accessToken: "token-1" });
      return new Response("server error", { status: 500 });
    });
    const adapter = createPrivateWebMutationAdapter({ fetchImpl });

    await expect(adapter.delete("c1")).rejects.toThrow("삭제 실패 (500)");
    expect(fetchImpl.mock.calls.filter(([url]) => String(url).includes("/backend-api/conversation/"))).toHaveLength(1);
  });

  it("clears the cached token after an authorization failure", async () => {
    let sessions = 0;
    const fetchImpl = vi.fn(async (input: string) => {
      if (input === "/api/auth/session") {
        sessions += 1;
        return jsonResponse({ accessToken: `token-${sessions}` });
      }
      if (sessions === 1) return new Response("unauthorized", { status: 401 });
      return jsonResponse({ success: true });
    });
    const adapter = createPrivateWebMutationAdapter({ fetchImpl });

    await expect(adapter.archive("c1")).rejects.toThrow("보관 실패 (401)");
    await adapter.archive("c1");
    expect(sessions).toBe(2);
  });
});
