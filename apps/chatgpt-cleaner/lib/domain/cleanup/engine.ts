import type { CleanupItemStatus } from "../types";

export type CleanupOperationKind = "archive" | "delete";

export interface CleanupTarget {
  sourceId: string;
}

export interface CleanupItemResult {
  sourceId: string;
  status: Extract<CleanupItemStatus, "succeeded" | "failed" | "skipped">;
  errorMessage?: string;
}

export interface CleanupOperationInput {
  operationId: string;
  kind: CleanupOperationKind;
  targets: CleanupTarget[];
  concurrency?: number;
}

export interface CleanupMutator {
  archive(sourceId: string): Promise<void>;
  delete(sourceId: string): Promise<void>;
}

export interface CleanupCapabilities {
  canArchive: boolean;
  canDelete: boolean;
}

const seenOperationIds = new Set<string>();

export function resetCleanupOperationGuardForTests(): void {
  seenOperationIds.clear();
}

export async function runCleanupOperation(
  input: CleanupOperationInput,
  capabilities: CleanupCapabilities,
  mutator: CleanupMutator,
): Promise<CleanupItemResult[]> {
  if (seenOperationIds.has(input.operationId)) {
    return input.targets.map((target) => ({
      sourceId: target.sourceId,
      status: "skipped",
      errorMessage: "duplicate operation id",
    }));
  }
  seenOperationIds.add(input.operationId);

  const targets = input.targets.map((target) => ({ sourceId: target.sourceId }));
  if (targets.length === 0) return [];

  if (input.kind === "archive" && !capabilities.canArchive) {
    return targets.map((target) => ({
      sourceId: target.sourceId,
      status: "failed",
      errorMessage: "Archive unavailable: compatibility gate closed",
    }));
  }

  if (input.kind === "delete" && !capabilities.canDelete) {
    return targets.map((target) => ({
      sourceId: target.sourceId,
      status: "failed",
      errorMessage: "Delete unavailable: compatibility gate closed",
    }));
  }

  const concurrency = Math.max(1, Math.min(input.concurrency ?? 3, 4));
  const results: CleanupItemResult[] = new Array(targets.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;
      if (current >= targets.length) return;
      const target = targets[current]!;
      try {
        if (input.kind === "archive") {
          await mutator.archive(target.sourceId);
        } else if (input.kind === "delete") {
          await mutator.delete(target.sourceId);
        } else {
          // Exhaustiveness: kinds are only archive|delete.
          results[current] = {
            sourceId: target.sourceId,
            status: "failed",
            errorMessage: "unknown operation kind",
          };
          continue;
        }
        results[current] = { sourceId: target.sourceId, status: "succeeded" };
      } catch (error) {
        results[current] = {
          sourceId: target.sourceId,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "unknown mutation failure",
        };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, targets.length) }, () => worker()));
  return results;
}

export function retryFailedOnly(previous: CleanupItemResult[]): CleanupTarget[] {
  return previous
    .filter((item) => item.status === "failed")
    .map((item) => ({ sourceId: item.sourceId }));
}

export function createOperationId(kind: CleanupOperationKind): string {
  return `${kind}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}
