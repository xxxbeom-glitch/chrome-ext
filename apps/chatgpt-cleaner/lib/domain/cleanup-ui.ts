import type { DiscoveryCompleteness } from "../domain/types";

export type DiscoveryOutcome = "loading" | "ready" | "failed";

export function filterCleanupItems<T extends { title: string }>(
  items: T[],
  query: string,
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => item.title.toLowerCase().includes(normalized));
}

export function selectedCount(items: { selected: boolean }[]): number {
  return items.filter((item) => item.selected).length;
}

export function discoverySummary(
  loadedCount: number,
  completeness: DiscoveryCompleteness,
  outcome: DiscoveryOutcome = "ready",
): string {
  if (outcome === "failed") {
    return loadedCount > 0
      ? `${loadedCount}개 대화 · 추가 목록을 확인하지 못했습니다`
      : "대화 목록을 불러오지 못했습니다";
  }
  switch (completeness) {
    case "loading":
      return `대화를 불러오는 중… (${loadedCount}개 발견)`;
    case "hasMore":
      return `${loadedCount}개 대화 발견 · 더 있을 수 있음`;
    case "endConfirmed":
      return `${loadedCount}개 대화 · 목록 끝 확인됨`;
    case "unknown":
      return `${loadedCount}개 대화 발견 · 완전성 미확인`;
  }
}

export function emptyListMessage(
  query: string,
  completeness: DiscoveryCompleteness,
  outcome: DiscoveryOutcome,
): string {
  if (query.trim()) return "검색과 일치하는 대화가 없습니다.";
  if (outcome === "loading" || completeness === "loading") return "불러오는 중...";
  if (outcome === "failed") return "대화 목록을 불러오지 못했습니다.";
  if (completeness === "endConfirmed") return "대화가 없습니다";
  return "아직 표시할 대화가 없습니다. 전체 목록인지는 확인되지 않았습니다.";
}

export function selectAllLoadedLabel(completeness: DiscoveryCompleteness): string {
  return completeness === "endConfirmed" ? "전체 선택" : "불러온 대화 전체 선택";
}

export const DISCOVERY_FAILED_NOTE =
  "ChatGPT 대화 목록을 불러오지 못했습니다. 현재 페이지 구조와 호환성을 확인하고 있습니다.";
