import type { DiscoveredConversation, DiscoveryCompleteness } from "../types";

export const CONVERSATIONS_PAGE_LIMIT = 28;
export const CONVERSATIONS_MAX_PAGES = 80;
export const CONVERSATIONS_PAGE_GAP_MS = 150;

export const SESSION_PATH = "/api/auth/session";
export const CONVERSATIONS_PATH = "/backend-api/conversations";

export interface ConversationsListItem {
  id: string;
  title: string;
  updatedAt?: string;
}

export interface ConversationsPage {
  items: ConversationsListItem[];
  offset: number;
  limit: number;
  total?: number;
  hasMissingConversations?: boolean;
}

export type HistoryFetch = (input: string, init?: RequestInit) => Promise<Response>;

export function parseSessionAccessToken(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const token = (value as { accessToken?: unknown }).accessToken;
  return typeof token === "string" && token.length > 0 ? token : null;
}

function asNonNegativeInt(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : undefined;
}

function itemId(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as { id?: unknown; conversation_id?: unknown };
  if (typeof record.id === "string" && record.id.trim()) return record.id.trim();
  if (typeof record.conversation_id === "string" && record.conversation_id.trim()) {
    return record.conversation_id.trim();
  }
  return null;
}

function itemTitle(raw: unknown, sourceId: string): string {
  if (raw && typeof raw === "object") {
    const title = (raw as { title?: unknown }).title;
    if (typeof title === "string" && title.trim()) return title.trim();
  }
  return `대화 ${sourceId.slice(0, 8)}`;
}

function itemUpdatedAt(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const record = raw as { update_time?: unknown; create_time?: unknown };
  for (const value of [record.update_time, record.create_time]) {
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) {
      const ms = value > 1e12 ? value : value * 1000;
      return new Date(ms).toISOString();
    }
  }
  return undefined;
}

export function parseConversationsPage(value: unknown): ConversationsPage | null {
  if (!value || typeof value !== "object") return null;
  const record = value as {
    items?: unknown;
    offset?: unknown;
    limit?: unknown;
    total?: unknown;
    has_missing_conversations?: unknown;
  };
  if (!Array.isArray(record.items)) return null;

  const items: ConversationsListItem[] = [];
  for (const raw of record.items) {
    const id = itemId(raw);
    if (!id) continue;
    items.push({
      id,
      title: itemTitle(raw, id),
      ...(itemUpdatedAt(raw) ? { updatedAt: itemUpdatedAt(raw) } : {}),
    });
  }

  if (record.items.length > 0 && items.length === 0) return null;

  const offset = asNonNegativeInt(record.offset) ?? 0;
  const limit = asNonNegativeInt(record.limit) ?? CONVERSATIONS_PAGE_LIMIT;
  const total = asNonNegativeInt(record.total);
  const hasMissing =
    typeof record.has_missing_conversations === "boolean"
      ? record.has_missing_conversations
      : undefined;

  return {
    items,
    offset,
    limit,
    ...(total !== undefined ? { total } : {}),
    ...(hasMissing !== undefined ? { hasMissingConversations: hasMissing } : {}),
  };
}

export function pageCompleteness(page: ConversationsPage): DiscoveryCompleteness {
  if (page.hasMissingConversations === true) return "hasMore";
  if (page.items.length === 0) return "endConfirmed";
  if (page.items.length < page.limit) return "endConfirmed";
  if (page.total !== undefined && page.offset + page.items.length >= page.total) {
    return "endConfirmed";
  }
  return "hasMore";
}

export function toDiscovered(item: ConversationsListItem): DiscoveredConversation {
  return {
    sourceId: item.id,
    title: item.title,
    sourceUrl: `https://chatgpt.com/c/${item.id}`,
    ...(item.updatedAt ? { updatedAt: item.updatedAt } : {}),
  };
}

export function mergeUnique(
  existing: DiscoveredConversation[],
  incoming: DiscoveredConversation[],
): DiscoveredConversation[] {
  const seen = new Set(existing.map((item) => item.sourceId));
  const next = [...existing];
  for (const item of incoming) {
    if (seen.has(item.sourceId)) continue;
    seen.add(item.sourceId);
    next.push(item);
  }
  return next;
}

export function conversationsUrl(offset: number, limit = CONVERSATIONS_PAGE_LIMIT): string {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    order: "updated",
  });
  return `${CONVERSATIONS_PATH}?${params.toString()}`;
}

export async function fetchSessionToken(fetchImpl: HistoryFetch): Promise<string> {
  const response = await fetchImpl(SESSION_PATH, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`session ${response.status}`);
  }
  const token = parseSessionAccessToken(await response.json());
  if (!token) throw new Error("session missing accessToken");
  return token;
}

export async function fetchConversationsPage(
  fetchImpl: HistoryFetch,
  token: string,
  offset: number,
): Promise<ConversationsPage> {
  const response = await fetchImpl(conversationsUrl(offset), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`conversations ${response.status}`);
  }
  const page = parseConversationsPage(await response.json());
  if (!page) throw new Error("conversations schema mismatch");
  return page;
}
