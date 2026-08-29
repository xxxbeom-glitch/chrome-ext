import { describe, expect, it } from "vitest";
import { DISCOVERY_FAILED_NOTE } from "../../lib/domain/cleanup-ui";
import { discoverAccountHistory } from "../../lib/adapters/chatgpt/account-history";
import { discoverConversationsFromDom } from "../../lib/adapters/chatgpt/discovery";
import {
  parseConversationsPage,
  parseSessionAccessToken,
  pageCompleteness,
  mergeUnique,
} from "../../lib/adapters/chatgpt/private-web/conversations";
import { probeCompatibility } from "../../lib/adapters/chatgpt/compatibility";
import {
  CONVERSATION_PAGE_FIXTURE,
  MISSING_SELECTOR_PAGE_FIXTURE,
} from "../fixtures/chatgpt/pages";

const COLLAPSED_SIDEBAR_FIXTURE = `
<!doctype html>
<html>
  <body>
    <nav aria-label="Chat history" hidden></nav>
    <main><h1>ChatGPT</h1></main>
  </body>
</html>
`.trim();

function loadHtml(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function fetchFromMap(routes: Record<string, Response | (() => Response)>): typeof fetch {
  return async (input) => {
    const url = String(input);
    const key = Object.keys(routes).find((candidate) => url.includes(candidate));
    if (!key) return new Response("missing", { status: 404 });
    const value = routes[key]!;
    return typeof value === "function" ? value() : value.clone();
  };
}

describe("private-web conversation schema", () => {
  it("parses a validated history page and rejects drift", () => {
    const page = parseConversationsPage({
      items: [
        { id: "aaa", title: "One", update_time: "2026-08-01T00:00:00Z" },
        { conversation_id: "bbb", title: "Two" },
      ],
      offset: 0,
      limit: 28,
      total: 2,
    });
    expect(page?.items.map((item) => item.id)).toEqual(["aaa", "bbb"]);
    expect(pageCompleteness(page!)).toBe("endConfirmed");
    expect(parseConversationsPage({ offset: 0 })).toBeNull();
    expect(parseConversationsPage({ items: [{ title: "no id" }] })).toBeNull();
    expect(parseSessionAccessToken({ accessToken: "tok" })).toBe("tok");
    expect(parseSessionAccessToken({})).toBeNull();
  });

  it("keeps hasMore when a full page is returned", () => {
    const items = Array.from({ length: 28 }, (_, index) => ({ id: `id-${index}`, title: `T${index}` }));
    const page = parseConversationsPage({ items, offset: 0, limit: 28, total: 90 });
    expect(pageCompleteness(page!)).toBe("hasMore");
  });

  it("does not claim endConfirmed when has_missing_conversations is true", () => {
    const page = parseConversationsPage({
      items: [{ id: "only", title: "X" }],
      offset: 0,
      limit: 28,
      total: 1,
      has_missing_conversations: true,
    });
    expect(pageCompleteness(page!)).toBe("hasMore");
  });

  it("de-duplicates conversation ids", () => {
    const merged = mergeUnique(
      [{ sourceId: "a", title: "A", sourceUrl: "https://chatgpt.com/c/a" }],
      [
        { sourceId: "a", title: "A2", sourceUrl: "https://chatgpt.com/c/a" },
        { sourceId: "b", title: "B", sourceUrl: "https://chatgpt.com/c/b" },
      ],
    );
    expect(merged.map((item) => item.sourceId)).toEqual(["a", "b"]);
  });
});

describe("DOM discovery", () => {
  it("reads expanded sidebar links without claiming endConfirmed", () => {
    const page = discoverConversationsFromDom(loadHtml(CONVERSATION_PAGE_FIXTURE));
    expect(page.items).toHaveLength(2);
    expect(page.completeness).toBe("hasMore");
  });

  it("finds no links when the sidebar is collapsed / unrendered", () => {
    const page = discoverConversationsFromDom(loadHtml(COLLAPSED_SIDEBAR_FIXTURE));
    expect(page.items).toHaveLength(0);
    expect(page.completeness).toBe("unknown");
  });
});

describe("discoverAccountHistory", () => {
  it("loads history from private-web even when no sidebar links exist", async () => {
    const result = await discoverAccountHistory({
      document: loadHtml(COLLAPSED_SIDEBAR_FIXTURE),
      sleep: async () => undefined,
      fetchImpl: fetchFromMap({
        "/api/auth/session": jsonResponse({ accessToken: "tok" }),
        "/backend-api/conversations": jsonResponse({
          items: [
            { id: "c1", title: "Alpha", update_time: "2026-08-01T00:00:00Z" },
            { id: "c2", title: "Beta" },
          ],
          offset: 0,
          limit: 28,
          total: 2,
        }),
      }),
    });
    expect(result.source).toBe("private-web");
    expect(result.outcome).toBe("ready");
    expect(result.completeness).toBe("endConfirmed");
    expect(result.items.map((item) => item.sourceId)).toEqual(["c1", "c2"]);
    expect(result.userNote).not.toMatch(/conversation links not found/i);
  });

  it("paginates until the account end is proven", async () => {
    const first = jsonResponse({
      items: Array.from({ length: 28 }, (_, index) => ({ id: `p1-${index}`, title: `A${index}` })),
      offset: 0,
      limit: 28,
      total: 30,
    });
    const second = jsonResponse({
      items: [
        { id: "p1-0", title: "dup" },
        { id: "tail-1", title: "Tail" },
        { id: "tail-2", title: "Tail 2" },
      ],
      offset: 28,
      limit: 28,
      total: 30,
    });
    let conversationsCalls = 0;
    const result = await discoverAccountHistory({
      document: loadHtml(COLLAPSED_SIDEBAR_FIXTURE),
      sleep: async () => undefined,
      fetchImpl: async (input) => {
        const url = String(input);
        if (url.includes("/api/auth/session")) return jsonResponse({ accessToken: "tok" });
        conversationsCalls += 1;
        return conversationsCalls === 1 ? first.clone() : second.clone();
      },
    });
    expect(conversationsCalls).toBe(2);
    expect(result.items).toHaveLength(30);
    expect(result.completeness).toBe("endConfirmed");
    expect(result.items.filter((item) => item.sourceId === "p1-0")).toHaveLength(1);
  });

  it("treats a validated empty account as real empty, not failure", async () => {
    const result = await discoverAccountHistory({
      document: loadHtml(COLLAPSED_SIDEBAR_FIXTURE),
      fetchImpl: fetchFromMap({
        "/api/auth/session": jsonResponse({ accessToken: "tok" }),
        "/backend-api/conversations": jsonResponse({
          items: [],
          offset: 0,
          limit: 28,
          total: 0,
        }),
      }),
    });
    expect(result.outcome).toBe("ready");
    expect(result.completeness).toBe("endConfirmed");
    expect(result.items).toHaveLength(0);
    expect(result.userNote).toContain("이 계정에서 불러온 대화가 없습니다");
  });

  it("falls back to visible DOM links when the history request fails", async () => {
    const result = await discoverAccountHistory({
      document: loadHtml(CONVERSATION_PAGE_FIXTURE),
      fetchImpl: fetchFromMap({
        "/api/auth/session": jsonResponse({ accessToken: "tok" }),
        "/backend-api/conversations": jsonResponse({ detail: "nope" }, 401),
      }),
    });
    expect(result.source).toBe("dom");
    expect(result.completeness).toBe("hasMore");
    expect(result.items).toHaveLength(2);
    expect(result.userNote).toContain("사이드바에 보이는 대화만");
  });

  it("marks discovery failed when there are no links and the request fails", async () => {
    const result = await discoverAccountHistory({
      document: loadHtml(MISSING_SELECTOR_PAGE_FIXTURE),
      fetchImpl: async () => jsonResponse({}, 500),
    });
    expect(result.outcome).toBe("failed");
    expect(result.items).toHaveLength(0);
    expect(result.userNote).toBe(DISCOVERY_FAILED_NOTE);
    expect(result.userNote).not.toMatch(/conversation links not found/i);
  });

  it("fails closed on schema drift instead of inventing an empty list", async () => {
    const result = await discoverAccountHistory({
      document: loadHtml(COLLAPSED_SIDEBAR_FIXTURE),
      fetchImpl: fetchFromMap({
        "/api/auth/session": jsonResponse({ accessToken: "tok" }),
        "/backend-api/conversations": jsonResponse({ unexpected: true }),
      }),
    });
    expect(result.outcome).toBe("failed");
    expect(result.completeness).not.toBe("endConfirmed");
  });
});

describe("compatibility diagnostics stay internal", () => {
  it("keeps English reasons off the user-facing discovery note", () => {
    const probe = probeCompatibility(loadHtml(COLLAPSED_SIDEBAR_FIXTURE));
    expect(probe.reasons.join(" ")).toMatch(/conversation links not found/);
    expect(DISCOVERY_FAILED_NOTE).not.toContain("conversation links not found");
    expect(DISCOVERY_FAILED_NOTE).not.toContain("assistant action rows not found");
  });
});
