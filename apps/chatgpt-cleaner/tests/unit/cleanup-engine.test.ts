import { afterEach, describe, expect, it } from "vitest";
import {
  createOperationId,
  resetCleanupOperationGuardForTests,
  retryFailedOnly,
  runCleanupOperation,
} from "../../lib/domain/cleanup/engine";
import { createRecordingMutationAdapter } from "../../lib/adapters/chatgpt/mutations";

describe("cleanup mutation engine", () => {
  afterEach(() => {
    resetCleanupOperationGuardForTests();
  });

  it("handles zero targets", async () => {
    const mutator = createRecordingMutationAdapter({});
    const results = await runCleanupOperation(
      { operationId: createOperationId("archive"), kind: "archive", targets: [] },
      mutator.capabilities,
      mutator,
    );
    expect(results).toEqual([]);
    expect(mutator.archiveCalls).toEqual([]);
  });

  it("archives one and many targets without calling delete", async () => {
    const mutator = createRecordingMutationAdapter({});
    const results = await runCleanupOperation(
      {
        operationId: "archive-many",
        kind: "archive",
        targets: [{ sourceId: "a" }, { sourceId: "b" }, { sourceId: "c" }],
        concurrency: 2,
      },
      mutator.capabilities,
      mutator,
    );
    expect(results.every((item) => item.status === "succeeded")).toBe(true);
    expect(mutator.archiveCalls.sort()).toEqual(["a", "b", "c"]);
    expect(mutator.deleteCalls).toEqual([]);
  });

  it("never falls through archive to delete when gated", async () => {
    const mutator = createRecordingMutationAdapter({
      capabilities: { canArchive: false, canDelete: true },
    });
    const results = await runCleanupOperation(
      {
        operationId: "archive-gated",
        kind: "archive",
        targets: [{ sourceId: "a" }],
      },
      mutator.capabilities,
      mutator,
    );
    expect(results[0]?.status).toBe("failed");
    expect(mutator.archiveCalls).toEqual([]);
    expect(mutator.deleteCalls).toEqual([]);
  });

  it("reports partial failure and retries failed only", async () => {
    const mutator = createRecordingMutationAdapter({ failIds: ["b"] });
    const first = await runCleanupOperation(
      {
        operationId: "delete-partial",
        kind: "delete",
        targets: [{ sourceId: "a" }, { sourceId: "b" }, { sourceId: "c" }],
      },
      mutator.capabilities,
      mutator,
    );
    expect(first.filter((item) => item.status === "failed").map((item) => item.sourceId)).toEqual([
      "b",
    ]);

    resetCleanupOperationGuardForTests();
    const retryMutator = createRecordingMutationAdapter({});
    const retryTargets = retryFailedOnly(first);
    const second = await runCleanupOperation(
      {
        operationId: "delete-retry",
        kind: "delete",
        targets: retryTargets,
      },
      retryMutator.capabilities,
      retryMutator,
    );
    expect(retryTargets).toEqual([{ sourceId: "b" }]);
    expect(second).toEqual([{ sourceId: "b", status: "succeeded" }]);
    expect(retryMutator.deleteCalls).toEqual(["b"]);
  });

  it("skips duplicate operation ids", async () => {
    const mutator = createRecordingMutationAdapter({});
    const input = {
      operationId: "dup-1",
      kind: "archive" as const,
      targets: [{ sourceId: "a" }],
    };
    await runCleanupOperation(input, mutator.capabilities, mutator);
    const second = await runCleanupOperation(input, mutator.capabilities, mutator);
    expect(second[0]?.status).toBe("skipped");
    expect(mutator.archiveCalls).toEqual(["a"]);
  });
});
