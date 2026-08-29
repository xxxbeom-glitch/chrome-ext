import { DISCOVERY_FAILED_NOTE } from "../../domain/cleanup-ui";
import { discoverConversationsFromDom } from "./discovery";
import {
  CONVERSATIONS_MAX_PAGES,
  CONVERSATIONS_PAGE_GAP_MS,
  CONVERSATIONS_PAGE_LIMIT,
  fetchConversationsPage,
  fetchSessionToken,
  mergeUnique,
  pageCompleteness,
  toDiscovered,
  type HistoryFetch,
} from "./private-web/conversations";
import type { DiscoveredConversation, DiscoveryCompleteness } from "./types";

export interface AccountHistoryResult {
  items: DiscoveredConversation[];
  completeness: DiscoveryCompleteness;
  outcome: "ready" | "failed";
  source: "private-web" | "dom" | "none";
  userNote: string;
  internalError?: string;
}

export interface DiscoverAccountHistoryOptions {
  document: Document;
  fetchImpl?: HistoryFetch;
  sleep?: (ms: number) => Promise<void>;
  pageLimit?: number;
  maxPages?: number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function fromDom(doc: Document, internalError: string): AccountHistoryResult {
  const page = discoverConversationsFromDom(doc);
  if (page.items.length === 0) {
    return {
      items: [],
      completeness: "unknown",
      outcome: "failed",
      source: "none",
      userNote: DISCOVERY_FAILED_NOTE,
      internalError,
    };
  }
  return {
    items: page.items,
    completeness: "hasMore",
    outcome: "ready",
    source: "dom",
    userNote:
      "사이드바에 보이는 대화만 표시합니다. 전체 계정 목록인지는 확인되지 않았습니다. 보관/삭제는 아직 실행되지 않습니다.",
    internalError,
  };
}

export async function discoverAccountHistory(
  options: DiscoverAccountHistoryOptions,
): Promise<AccountHistoryResult> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const sleep = options.sleep ?? defaultSleep;
  const maxPages = options.maxPages ?? CONVERSATIONS_MAX_PAGES;
  const requestedLimit = options.pageLimit ?? CONVERSATIONS_PAGE_LIMIT;

  try {
    const token = await fetchSessionToken(fetchImpl);
    let items: DiscoveredConversation[] = [];
    let offset = 0;
    let completeness: DiscoveryCompleteness = "hasMore";

    for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
      const page = await fetchConversationsPage(fetchImpl, token, offset);
      items = mergeUnique(items, page.items.map(toDiscovered));
      completeness = pageCompleteness(page);
      if (completeness === "endConfirmed") {
        return {
          items,
          completeness,
          outcome: "ready",
          source: "private-web",
          userNote:
            items.length === 0
              ? "이 계정에서 불러온 대화가 없습니다. 보관/삭제는 아직 실행되지 않습니다."
              : "계정 대화 목록을 불러왔습니다. 보관/삭제는 ChatGPT 호환성이 확인될 때까지 실행되지 않습니다.",
        };
      }
      offset = page.offset + (page.limit || requestedLimit);
      if (pageIndex + 1 < maxPages) await sleep(CONVERSATIONS_PAGE_GAP_MS);
    }

    return {
      items,
      completeness: "hasMore",
      outcome: "ready",
      source: "private-web",
      userNote:
        "대화 목록을 일부 불러왔습니다. 더 있을 수 있어 전체를 확인하지는 못했습니다. 보관/삭제는 실행되지 않습니다.",
    };
  } catch (error) {
    const internalError = error instanceof Error ? error.message : "history fetch failed";
    return fromDom(options.document, internalError);
  }
}
