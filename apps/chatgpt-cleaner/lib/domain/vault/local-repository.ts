import type { MessageSnapshot, SnapshotBlock, SnapshotMessage } from "../../adapters/chatgpt/types";

export interface VaultRecord {
  id: string;
  sourceConversationId: string;
  sourceUrl?: string;
  sourceConversationTitle: string;
  sourceMessageId?: string;
  sourceMessageKey: string;
  role: SnapshotMessage["role"];
  messageOrdinal: number;
  blocks: SnapshotBlock[];
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type VaultSaveResult =
  | { ok: true; record: VaultRecord; deduplicated: boolean }
  | { ok: false; error: string; preservedExisting: boolean };

function localRecordId(snapshot: MessageSnapshot): string {
  const safeKey = snapshot.sourceMessageKey.replace(/[^a-zA-Z0-9:_-]/g, "-");
  return `local-${snapshot.sourceConversationId}-${safeKey}`;
}

export class LocalVaultRepository {
  private records = new Map<string, VaultRecord>();

  list(): VaultRecord[] {
    return [...this.records.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get(id: string): VaultRecord | undefined {
    return this.records.get(id);
  }

  getBySourceMessage(sourceConversationId: string, sourceMessageKey: string): VaultRecord | undefined {
    for (const record of this.records.values()) {
      if (
        record.sourceConversationId === sourceConversationId &&
        record.sourceMessageKey === sourceMessageKey
      ) {
        return record;
      }
    }
    return undefined;
  }

  /** Test/load helper: replace repository contents wholesale. */
  replaceAll(records: VaultRecord[]): void {
    this.records.clear();
    for (const record of records) this.records.set(record.id, structuredClone(record));
  }

  saveItem(snapshot: MessageSnapshot): VaultSaveResult {
    if (snapshot.blocks.length === 0) {
      return { ok: false, error: "저장할 메시지 내용이 없습니다", preservedExisting: true };
    }

    const existing = this.getBySourceMessage(
      snapshot.sourceConversationId,
      snapshot.sourceMessageKey,
    );
    const now = new Date().toISOString();
    const record: VaultRecord = {
      id: existing?.id ?? localRecordId(snapshot),
      sourceConversationId: snapshot.sourceConversationId,
      ...(snapshot.sourceUrl ? { sourceUrl: snapshot.sourceUrl } : {}),
      sourceConversationTitle: snapshot.sourceConversationTitle,
      ...(snapshot.sourceMessageId ? { sourceMessageId: snapshot.sourceMessageId } : {}),
      sourceMessageKey: snapshot.sourceMessageKey,
      role: snapshot.role,
      messageOrdinal: snapshot.messageOrdinal,
      blocks: structuredClone(snapshot.blocks),
      capturedAt: snapshot.capturedAt,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.records.set(record.id, record);
    return { ok: true, record, deduplicated: !!existing };
  }

  deleteVaultOnly(id: string): boolean {
    return this.records.delete(id);
  }
}

/** V2 key so legacy whole-conversation local records remain untouched for rollback. */
const STORAGE_KEY = "ce.vault.savedMessageItems.v2";

export async function persistLocalVault(repo: LocalVaultRepository): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: repo.list() });
}

export async function loadLocalVault(): Promise<LocalVaultRepository> {
  const repo = new LocalVaultRepository();
  const result = await browser.storage.local.get(STORAGE_KEY);
  const rows = result[STORAGE_KEY];
  if (!Array.isArray(rows)) return repo;
  const valid = rows.filter((row): row is VaultRecord => {
    return (
      !!row &&
      typeof row === "object" &&
      typeof (row as VaultRecord).id === "string" &&
      typeof (row as VaultRecord).sourceConversationId === "string" &&
      typeof (row as VaultRecord).sourceMessageKey === "string" &&
      Array.isArray((row as VaultRecord).blocks)
    );
  });
  repo.replaceAll(valid);
  return repo;
}
