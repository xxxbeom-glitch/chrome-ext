import type { MessageSnapshot } from "../../adapters/chatgpt/types";
import {
  loadLocalVault,
  persistLocalVault,
  type VaultRecord,
  type VaultSaveResult,
} from "./local-repository";
import { getAuthSessionState, signOut } from "../../supabase/auth";
import { isSupabaseConfigured } from "../../supabase/config";
import { SupabaseCloudVaultRepository } from "../../supabase/cloud-vault-repository";

export type VaultBackend = "cloud" | "local";

export interface VaultService {
  backend(): Promise<VaultBackend>;
  list(): Promise<VaultRecord[]>;
  get(id: string): Promise<VaultRecord | undefined>;
  saveItem(snapshot: MessageSnapshot): Promise<VaultSaveResult & { backend: VaultBackend }>;
  deleteVaultOnly(id: string): Promise<boolean>;
  signOut(): Promise<void>;
}

export interface VaultServiceDeps {
  cloud?: SupabaseCloudVaultRepository;
  useCloud?: () => Promise<boolean>;
  loadLocal?: typeof loadLocalVault;
  persistLocal?: typeof persistLocalVault;
  signOutSession?: typeof signOut;
}

async function defaultUseCloud(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const session = await getAuthSessionState();
  return session.status === "signed_in";
}

export function createVaultService(deps: VaultServiceDeps = {}): VaultService {
  const cloud = deps.cloud ?? new SupabaseCloudVaultRepository();
  const useCloud = deps.useCloud ?? defaultUseCloud;
  const loadLocal = deps.loadLocal ?? loadLocalVault;
  const persistLocal = deps.persistLocal ?? persistLocalVault;
  const signOutSession = deps.signOutSession ?? signOut;

  return {
    async backend() {
      return (await useCloud()) ? "cloud" : "local";
    },
    async list() {
      if (await useCloud()) {
        try {
          return await cloud.list();
        } catch {
          const local = await loadLocal();
          return local.list();
        }
      }
      const local = await loadLocal();
      return local.list();
    },
    async get(id: string) {
      const records = await this.list();
      return records.find((record) => record.id === id);
    },
    async saveItem(snapshot) {
      if (await useCloud()) {
        const result = await cloud.saveItem(snapshot);
        return { ...result, backend: "cloud" as const };
      }
      const local = await loadLocal();
      const result = local.saveItem(snapshot);
      if (result.ok) await persistLocal(local);
      return { ...result, backend: "local" as const };
    },
    async deleteVaultOnly(id: string) {
      if (await useCloud()) return cloud.deleteVaultOnly(id);
      const local = await loadLocal();
      const deleted = local.deleteVaultOnly(id);
      if (deleted) await persistLocal(local);
      return deleted;
    },
    async signOut() {
      await signOutSession();
    },
  };
}

export const vaultService = createVaultService();
