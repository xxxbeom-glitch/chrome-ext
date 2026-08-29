import type { DiscoveryCompleteness } from "../domain/types";

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
): string {
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

export function selectAllLoadedLabel(completeness: DiscoveryCompleteness): string {
  return completeness === "endConfirmed" ? "전체 선택" : "불러온 대화 전체 선택";
}
