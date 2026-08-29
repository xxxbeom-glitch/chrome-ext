import type { ConversationSnapshot } from "../adapters/chatgpt/types";
import type { VaultRecord, VaultSaveResult } from "../domain/vault/local-repository";

export interface CloudVaultRepository {
  list(): Promise<VaultRecord[]>;
  saveSnapshot(input: {
    snapshot: ConversationSnapshot;
    anchor: {
      sourceMessageId?: string;
      messageOrdinal: number;
      excerpt: string;
      anchorKey?: string;
    };
  }): Promise<VaultSaveResult>;
  deleteVaultOnly(id: string): Promise<boolean>;
  clearLocalSessionCache(): Promise<void>;
}

/**
 * Placeholder cloud repository. Real Supabase CRUD wires in Phase 6 once auth session works.
 * Phase 5 only establishes the typed boundary and fail-soft behavior when unconfigured.
 */
export class UnconfiguredCloudVaultRepository implements CloudVaultRepository {
  async list(): Promise<VaultRecord[]> {
    return [];
  }

  async saveSnapshot(): Promise<VaultSaveResult> {
    return {
      ok: false,
      error: "Supabase is not configured or the user is signed out",
      preservedExisting: true,
    };
  }

  async deleteVaultOnly(): Promise<boolean> {
    return false;
  }

  async clearLocalSessionCache(): Promise<void> {
    // no-op
  }
}

export function createCloudVaultRepository(configured: boolean): CloudVaultRepository {
  if (!configured) return new UnconfiguredCloudVaultRepository();
  // Phase 6 replaces this with the authenticated Supabase implementation.
  return new UnconfiguredCloudVaultRepository();
}
