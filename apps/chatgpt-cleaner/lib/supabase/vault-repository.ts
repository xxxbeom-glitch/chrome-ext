import type { ConversationSnapshot } from "../adapters/chatgpt/types";
import type { VaultRecord, VaultSaveResult } from "../domain/vault/local-repository";
import { isSupabaseConfigured } from "./config";
import { SupabaseCloudVaultRepository } from "./cloud-vault-repository";

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
 * Fail-soft cloud repository used when Supabase public config is absent.
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

export function createCloudVaultRepository(
  configured: boolean = isSupabaseConfigured(),
): CloudVaultRepository {
  if (!configured) return new UnconfiguredCloudVaultRepository();
  return new SupabaseCloudVaultRepository();
}
