import type { ConversationSnapshot } from "../../adapters/chatgpt/types";

export interface VaultBookmark {
  id: string;
  sourceMessageId?: string;
  messageOrdinal: number;
  excerpt: string;
  anchorKey: string;
  createdAt: string;
}

export interface VaultRecord {
  id: string;
  sourceConversationId: string;
  sourceUrl?: string;
  title: string;
  snapshot: ConversationSnapshot;
  completeness: "complete" | "partial";
  messageCount: number;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
  bookmarks: VaultBookmark[];
}

export type VaultSaveResult =
  | { ok: true; record: VaultRecord }
  | { ok: false; error: string; preservedExisting: boolean };

function bookmarkKey(input: {
  sourceMessageId?: string;
  messageOrdinal: number;
  anchorKey?: string;
}): string {
  if (input.sourceMessageId) return `msg:${input.sourceMessageId}`;
  if (input.anchorKey) return input.anchorKey;
  return `ordinal:${input.messageOrdinal}`;
}

export class LocalVaultRepository {
  private records = new Map<string, VaultRecord>();

  list(): VaultRecord[] {
    return [...this.records.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get(id: string): VaultRecord | undefined {
    return this.records.get(id);
  }

  getBySource(sourceConversationId: string): VaultRecord | undefined {
    for (const record of this.records.values()) {
      if (record.sourceConversationId === sourceConversationId) return record;
    }
    return undefined;
  }

  /** Test/load helper: replace repository contents wholesale. */
  replaceAll(records: VaultRecord[]): void {
    this.records.clear();
    for (const record of records) {
      this.records.set(record.id, structuredClone(record));
    }
  }

  saveSnapshot(input: {
    snapshot: ConversationSnapshot;
    anchor: {
      sourceMessageId?: string;
      messageOrdinal: number;
      excerpt: string;
      anchorKey?: string;
    };
  }): VaultSaveResult {
    const { snapshot, anchor } = input;
    const existing = this.getBySource(snapshot.sourceConversationId);

    if (snapshot.completeness === "partial" && existing?.completeness === "complete") {
      return {
        ok: false,
        error: "완료된 보관함 스냅샷을 부분 캡처로 덮어쓰지 않습니다",
        preservedExisting: true,
      };
    }

    const now = new Date().toISOString();
    const id = existing?.id ?? `local-${snapshot.sourceConversationId}`;
    const bookmarks = existing?.bookmarks.map((item) => ({ ...item })) ?? [];
    const key = bookmarkKey(anchor);
    if (!bookmarks.some((item) => item.anchorKey === key)) {
      bookmarks.push({
        id: `bm-${bookmarks.length + 1}-${key}`,
        ...(anchor.sourceMessageId ? { sourceMessageId: anchor.sourceMessageId } : {}),
        messageOrdinal: anchor.messageOrdinal,
        excerpt: anchor.excerpt,
        anchorKey: key,
        createdAt: now,
      });
    }

    const record: VaultRecord = {
      id,
      sourceConversationId: snapshot.sourceConversationId,
      ...(snapshot.sourceUrl ? { sourceUrl: snapshot.sourceUrl } : {}),
      title: snapshot.title,
      snapshot,
      completeness: snapshot.completeness,
      messageCount: snapshot.messages.length,
      capturedAt: snapshot.capturedAt,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      bookmarks,
    };

    this.records.set(id, record);
    return { ok: true, record };
  }

  deleteVaultOnly(id: string): boolean {
    return this.records.delete(id);
  }
}

const STORAGE_KEY = "ce.vault.localRecords";

export async function persistLocalVault(repo: LocalVaultRepository): Promise<void> {
  await browser.storage.local.set({
    [STORAGE_KEY]: repo.list(),
  });
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
      !!(row as VaultRecord).snapshot
    );
  });
  repo.replaceAll(valid);
  return repo;
}
