import type { MessageSnapshot, SnapshotBlock, SnapshotMessage } from "../adapters/chatgpt/types";
import type { VaultRecord, VaultSaveResult } from "../domain/vault/local-repository";
import { getAuthSessionState, type AuthSessionState } from "./auth";
import { getSupabaseClient } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";

type VaultItemRow = {
  id: string;
  user_id: string;
  source_conversation_id: string;
  source_url: string | null;
  source_conversation_title: string;
  source_message_id: string | null;
  source_message_key: string;
  role: SnapshotMessage["role"];
  message_ordinal: number;
  content: SnapshotBlock[];
  captured_at: string;
  created_at: string;
  updated_at: string;
};

function toRecord(row: VaultItemRow): VaultRecord {
  return {
    id: row.id,
    sourceConversationId: row.source_conversation_id,
    ...(row.source_url ? { sourceUrl: row.source_url } : {}),
    sourceConversationTitle: row.source_conversation_title,
    ...(row.source_message_id ? { sourceMessageId: row.source_message_id } : {}),
    sourceMessageKey: row.source_message_key,
    role: row.role,
    messageOrdinal: row.message_ordinal,
    blocks: row.content,
    capturedAt: row.captured_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
      .from("vault_items")
      .select("*")
      .eq("user_id", session.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((rows ?? []) as VaultItemRow[]).map(toRecord);
  }

  async saveItem(snapshot: MessageSnapshot): Promise<VaultSaveResult> {
    const client = this.deps.getClient();
    const session = await this.deps.getSession();
    if (!client || session.status !== "signed_in") {
      return {
        ok: false,
        error: "Supabase가 설정되지 않았거나 로그아웃 상태입니다",
        preservedExisting: true,
      };
    }
    if (snapshot.blocks.length === 0) {
      return { ok: false, error: "저장할 메시지 내용이 없습니다", preservedExisting: true };
    }

    const { data: existing, error: existingError } = await client
      .from("vault_items")
      .select("id")
      .eq("user_id", session.userId)
      .eq("source_conversation_id", snapshot.sourceConversationId)
      .eq("source_message_key", snapshot.sourceMessageKey)
      .maybeSingle();
    if (existingError) {
      return { ok: false, error: existingError.message, preservedExisting: true };
    }

    const now = new Date().toISOString();
    const payload = {
      user_id: session.userId,
      source_conversation_id: snapshot.sourceConversationId,
      source_url: snapshot.sourceUrl ?? null,
      source_conversation_title: snapshot.sourceConversationTitle,
      source_message_id: snapshot.sourceMessageId ?? null,
      source_message_key: snapshot.sourceMessageKey,
      role: snapshot.role,
      message_ordinal: snapshot.messageOrdinal,
      content: snapshot.blocks,
      captured_at: snapshot.capturedAt,
      updated_at: now,
    };

    const { data: upserted, error: upsertError } = await client
      .from("vault_items")
      .upsert(payload, {
        onConflict: "user_id,source_conversation_id,source_message_key",
      })
      .select("*")
      .single();
    if (upsertError || !upserted) {
      return {
        ok: false,
        error: upsertError?.message ?? "보관함 저장에 실패했습니다",
        preservedExisting: true,
      };
    }

    return {
      ok: true,
      record: toRecord(upserted as VaultItemRow),
      deduplicated: !!existing,
    };
  }

  async deleteVaultOnly(id: string): Promise<boolean> {
    const client = this.deps.getClient();
    const session = await this.deps.getSession();
    if (!client || session.status !== "signed_in") return false;
    const { error } = await client
      .from("vault_items")
      .delete()
      .eq("user_id", session.userId)
      .eq("id", id);
    return !error;
  }

  async clearLocalSessionCache(): Promise<void> {
    // Session cleared via auth.signOut + chrome.storage adapter.
  }
}
