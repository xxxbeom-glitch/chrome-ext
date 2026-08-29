import type { CleanupCapabilities, CleanupMutator } from "../../domain/cleanup/engine";

/**
 * DOM mutation adapters are intentionally gated.
 * Until Archive/Delete controls are positively located for the current ChatGPT UI,
 * capabilities remain false and the mutator refuses to act.
 */
export interface DomMutationAdapter extends CleanupMutator {
  capabilities: CleanupCapabilities;
}

export function createFailClosedMutationAdapter(
  overrides?: Partial<CleanupCapabilities>,
): DomMutationAdapter {
  const capabilities: CleanupCapabilities = {
    canArchive: overrides?.canArchive ?? false,
    canDelete: overrides?.canDelete ?? false,
  };

  return {
    capabilities,
    async archive(sourceId: string): Promise<void> {
      if (!capabilities.canArchive) {
        throw new Error(`보관 차단됨 (${sourceId}): ChatGPT 호환성이 확인되지 않았습니다`);
      }
      throw new Error(`보관 어댑터가 아직 연결되지 않았습니다 (${sourceId})`);
    },
    async delete(sourceId: string): Promise<void> {
      if (!capabilities.canDelete) {
        throw new Error(`삭제 차단됨 (${sourceId}): ChatGPT 호환성이 확인되지 않았습니다`);
      }
      throw new Error(`삭제 어댑터가 아직 연결되지 않았습니다 (${sourceId})`);
    },
  };
}

export function createRecordingMutationAdapter(options: {
  failIds?: string[];
  capabilities?: Partial<CleanupCapabilities>;
}): DomMutationAdapter & { archiveCalls: string[]; deleteCalls: string[] } {
  const failIds = new Set(options.failIds ?? []);
  const capabilities: CleanupCapabilities = {
    canArchive: options.capabilities?.canArchive ?? true,
    canDelete: options.capabilities?.canDelete ?? true,
  };
  const archiveCalls: string[] = [];
  const deleteCalls: string[] = [];

  return {
    capabilities,
    archiveCalls,
    deleteCalls,
    async archive(sourceId: string): Promise<void> {
      if (!capabilities.canArchive) throw new Error("archive gated");
      archiveCalls.push(sourceId);
      if (failIds.has(sourceId)) throw new Error(`archive failed: ${sourceId}`);
    },
    async delete(sourceId: string): Promise<void> {
      if (!capabilities.canDelete) throw new Error("delete gated");
      deleteCalls.push(sourceId);
      if (failIds.has(sourceId)) throw new Error(`delete failed: ${sourceId}`);
    },
  };
}
