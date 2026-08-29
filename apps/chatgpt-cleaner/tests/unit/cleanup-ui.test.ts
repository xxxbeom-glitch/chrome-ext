import { describe, expect, it } from "vitest";
import {
  DISCOVERY_FAILED_NOTE,
  discoverySummary,
  emptyListMessage,
  filterCleanupItems,
  selectAllLoadedLabel,
  selectedCount,
} from "../../lib/domain/cleanup-ui";
import { MOCK_CLEANUP_ITEMS } from "../../lib/domain/mock-data";

describe("cleanup UI helpers", () => {
  it("filters by title without mutating source items", () => {
    const filtered = filterCleanupItems(MOCK_CLEANUP_ITEMS, "token");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.sourceId).toBe("c-1004");
    expect(MOCK_CLEANUP_ITEMS).toHaveLength(4);
  });

  it("counts selected rows", () => {
    expect(selectedCount(MOCK_CLEANUP_ITEMS)).toBe(1);
  });

  it("distinguishes discovery completeness wording", () => {
    expect(discoverySummary(4, "hasMore")).toContain("더 있을 수 있음");
    expect(discoverySummary(4, "endConfirmed")).toContain("목록 끝 확인됨");
    expect(selectAllLoadedLabel("hasMore")).toBe("불러온 대화 전체 선택");
    expect(selectAllLoadedLabel("endConfirmed")).toBe("전체 선택");
  });

  it("separates real empty, loading, and failed collection", () => {
    expect(emptyListMessage("", "endConfirmed", "ready")).toBe("대화가 없습니다");
    expect(emptyListMessage("", "loading", "loading")).toBe("불러오는 중...");
    expect(emptyListMessage("", "unknown", "failed")).toBe("대화 목록을 불러오지 못했습니다.");
    expect(emptyListMessage("", "unknown", "failed")).not.toBe("대화가 없습니다");
    expect(discoverySummary(0, "unknown", "failed")).toBe("대화 목록을 불러오지 못했습니다");
    expect(DISCOVERY_FAILED_NOTE).toContain("불러오지 못했습니다");
    expect(DISCOVERY_FAILED_NOTE).not.toMatch(/[A-Za-z]{8,}/);
  });
});
