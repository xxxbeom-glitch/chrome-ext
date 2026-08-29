import type { ConversationSnapshot } from "../adapters/chatgpt/types";
import type {
  VaultBookmark,
  VaultRecord,
  VaultSaveResult,
} from "../domain/vault/local-repository";
import { getAuthSessionState, type AuthSessionState } from "./auth";
import { getSupabaseClient } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";

type VaultRow = {
  id: string;
  user_id: string;
  source_conversation_id: string;
  source_url: string | null;
  title: string;
  snapshot: ConversationSnapshot;
  message_count: number;
  completeness: "complete" | "partial";
  captured_at: string;
  created_at: string;
  updated_at: string;
};

type BookmarkRow = {
  id: string;
  vault_conversation_id: string;
  source_message_id: string | null;
  message_ordinal: number;
  excerpt: string | null;
  anchor_key: string;
  created_at: string;
};

export function bookmarkKey(input: {
  sourceMessageId?: string;
  messageOrdinal: number;
  anchorKey?: string;
}): string {
  if (input.sourceMessageId) return `msg:${input.sourceMessageId}`;
  if (input.anchorKey) return input.anchorKey;
  return `ordinal:${input.messageOrdinal}`;
}

export function shouldRejectPartialOverwrite(
  existingCompleteness: "complete" | "partial" | undefined,
  incoming: "complete" | "partial",
): boolean {
  return incoming === "partial" && existingCompleteness === "complete";
}

function toRecord(row: VaultRow, bookmarks: BookmarkRow[]): VaultRecord {
  return {
    id: row.id,
    sourceConversationId: row.source_conversation_id,
    ...(row.source_url ? { sourceUrl: row.source_url } : {}),
    title: row.title,
    snapshot: row.snapshot,
    completeness: row.completeness,
    messageCount: row.message_count,
    capturedAt: row.captured_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    bookmarks: bookmarks.map(
      (bookmark): VaultBookmark => ({
        id: bookmark.id,
        ...(bookmark.source_message_id
          ? { sourceMessageId: bookmark.source_message_id }
          : {}),
        messageOrdinal: bookmark.message_ordinal,
        excerpt: bookmark.excerpt ?? "",
        anchorKey: bookmark.anchor_key,
        createdAt: bookmark.created_at,
      }),
    ),
  };
}

export interface CloudVaultDeps {
  getClient: () => SupabaseClient | null;
  getSession: () => Promise<AuthSessionState>;
}

const defaultDeps: CloudVaultDeps = {
  getClient: getSupabaseClient,
  getSession: getAuthSessionState,
};

export class SupabaseCloudVaultRepository {
  constructor(private readonly deps: CloudVaultDeps = defaultDeps) {}

  async list(): Promise<VaultRecord[]> {
    const client = this.deps.getClient();
    const session = await this.deps.getSession();
    if (!client || session.status !== "signed_in") return [];

    const { data: rows, error } = await client
      .from("vault_conversations")
      .select("*")
      .eq("user_id", session.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);

    const vaultRows = (rows ?? []) as VaultRow[];
    if (vaultRows.length === 0) return [];

    const ids = vaultRows.map((row) => row.id);
    const { data: bookmarkRows, error: bookmarkError } = await client
      .from("bookmarks")
      .select("*")
      .eq("user_id", session.userId)
      .in("vault_conversation_id", ids);
    if (bookmarkError) throw new Error(bookmarkError.message);

    const byVault = new Map<string, BookmarkRow[]>();
    for (const bookmark of (bookmarkRows ?? []) as BookmarkRow[]) {
      const list = byVault.get(bookmark.vault_conversation_id) ?? [];
      list.push(bookmark);
      byVault.set(bookmark.vault_conversation_id, list);
    }

    return vaultRows.map((row) => toRecord(row, byVault.get(row.id) ?? []));
  }

  async saveSnapshot(input: {
    snapshot: ConversationSnapshot;
    anchor: {
      sourceMessageId?: string;
      messageOrdinal: number;
      excerpt: string;
      anchorKey?: string;
    };
  }): Promise<VaultSaveResult> {
    const client = this.deps.getClient();
    const session = await this.deps.getSession();
    if (!client || session.status !== "signed_in") {
      return {
        ok: false,
        error: "Supabase is not configured or the user is signed out",
        preservedExisting: true,
      };
    }

    const { snapshot, anchor } = input;
    const { data: existing, error: existingError } = await client
      .from("vault_conversations")
      .select("*")
      .eq("user_id", session.userId)
      .eq("source_conversation_id", snapshot.sourceConversationId)
      .maybeSingle();
    if (existingError) {
      return { ok: false, error: existingError.message, preservedExisting: true };
    }

    const existingRow = (existing as VaultRow | null) ?? null;
    if (shouldRejectPartialOverwrite(existingRow?.completeness, snapshot.completeness)) {
      return {
        ok: false,
        error: "Refusing to overwrite a complete Vault snapshot with a partial capture",
        preservedExisting: true,
      };
    }

    const now = new Date().toISOString();
    const payload = {
      user_id: session.userId,
      source_conversation_id: snapshot.sourceConversationId,
      source_url: snapshot.sourceUrl ?? null,
      title: snapshot.title,
      snapshot_schema_version: 1,
      snapshot,
      message_count: snapshot.messages.length,
      completeness: snapshot.completeness,
      captured_at: snapshot.capturedAt,
      updated_at: now,
    };

    const { data: upserted, error: upsertError } = await client
      .from("vault_conversations")
      .upsert(payload, { onConflict: "user_id,source_conversation_id" })
      .select("*")
      .single();
    if (upsertError || !upserted) {
      return {
        ok: false,
        error: upsertError?.message ?? "Vault upsert failed",
        preservedExisting: true,
      };
    }

    const vaultRow = upserted as VaultRow;
    const key = bookmarkKey(anchor);
    const { error: bookmarkError } = await client.from("bookmarks").upsert(
      {
        user_id: session.userId,
        vault_conversation_id: vaultRow.id,
        source_message_id: anchor.sourceMessageId ?? null,
        message_ordinal: anchor.messageOrdinal,
        excerpt: anchor.excerpt,
        anchor_key: key,
      },
      { onConflict: "user_id,vault_conversation_id,anchor_key" },
    );
    if (bookmarkError) {
      return { ok: false, error: bookmarkError.message, preservedExisting: true };
    }

    const { data: bookmarks, error: listBookmarkError } = await client
      .from("bookmarks")
      .select("*")
      .eq("user_id", session.userId)
      .eq("vault_conversation_id", vaultRow.id);
    if (listBookmarkError) {
      return { ok: false, error: listBookmarkError.message, preservedExisting: true };
    }

    return {
      ok: true,
      record: toRecord(vaultRow, (bookmarks ?? []) as BookmarkRow[]),
    };
  }

  async deleteVaultOnly(id: string): Promise<boolean> {
    const client = this.deps.getClient();
    const session = await this.deps.getSession();
    if (!client || session.status !== "signed_in") return false;
    const { error } = await client
      .from("vault_conversations")
      .delete()
      .eq("user_id", session.userId)
      .eq("id", id);
    return !error;
  }

  async clearLocalSessionCache(): Promise<void> {
    // Session cleared via auth.signOut + chrome.storage adapter.
  }
}
