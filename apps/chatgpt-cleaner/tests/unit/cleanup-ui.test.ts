import { describe, expect, it } from "vitest";
import {
  discoverySummary,
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
    expect(discoverySummary(4, "hasMore")).toContain("more available");
    expect(discoverySummary(4, "endConfirmed")).toContain("end of list confirmed");
    expect(selectAllLoadedLabel("hasMore")).toBe("Select all loaded conversations");
    expect(selectAllLoadedLabel("endConfirmed")).toBe("Select all conversations");
  });
});
