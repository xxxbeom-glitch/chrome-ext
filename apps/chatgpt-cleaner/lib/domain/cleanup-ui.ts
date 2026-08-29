import type { CleanupListItem, DiscoveryCompleteness } from "../domain/types";

export function filterCleanupItems(
  items: CleanupListItem[],
  query: string,
): CleanupListItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => item.title.toLowerCase().includes(normalized));
}

export function selectedCount(items: CleanupListItem[]): number {
  return items.filter((item) => item.selected).length;
}

export function discoverySummary(
  loadedCount: number,
  completeness: DiscoveryCompleteness,
): string {
  switch (completeness) {
    case "loading":
      return `Loading conversations… (${loadedCount} discovered)`;
    case "hasMore":
      return `${loadedCount} conversations discovered · more available`;
    case "endConfirmed":
      return `${loadedCount} conversations · end of list confirmed`;
    case "unknown":
      return `${loadedCount} conversations discovered · completeness unknown`;
  }
}

export function selectAllLoadedLabel(completeness: DiscoveryCompleteness): string {
  return completeness === "endConfirmed"
    ? "Select all conversations"
    : "Select all loaded conversations";
}
