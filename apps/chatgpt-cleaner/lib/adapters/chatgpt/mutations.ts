import type { CleanupCapabilities, CleanupMutator } from "../../domain/cleanup/engine";
import { fetchSessionToken, type HistoryFetch } from "./private-web/conversations";

export interface DomMutationAdapter extends CleanupMutator {
  capabilities: CleanupCapabilities;
}

export interface PrivateWebMutationOptions {
  fetchImpl?: HistoryFetch;
}

const CONVERSATION_MUTATION_PATH = "/backend-api/conversation";

function conversationMutationUrl(sourceId: string): string {
  return `${CONVERSATION_MUTATION_PATH}/${encodeURIComponent(sourceId)}`;
}

async function mutationError(response: Response, action: "보관" | "삭제"): Promise<Error> {
  const detail = (await response.text().catch(() => "")).replace(/\s+/g, " ").trim().slice(0, 160);
  const suffix = detail ? `: ${detail}` : "";
  return new Error(`${action} 실패 (${response.status})${suffix}`);
}

/**
 * Live ChatGPT cleanup mutator.
 *
 * Current same-origin web contract:
 * - archive: PATCH /backend-api/conversation/{id} { is_archived: true }
 * - delete:  PATCH /backend-api/conversation/{id} { is_visible: false }
 *
 * The ChatGPT access token stays in memory only. Destructive PATCH requests are
 * never retried automatically; the user must explicitly retry a failed item.
 */
export function createPrivateWebMutationAdapter(
  options: PrivateWebMutationOptions = {},
): DomMutationAdapter {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  let accessToken: string | null = null;

  const capabilities: CleanupCapabilities = {
    canArchive: true,
    canDelete: true,
  };

  async function token(): Promise<string> {
    if (accessToken) return accessToken;
    accessToken = await fetchSessionToken(fetchImpl);
    return accessToken;
  }

  async function patch(
    sourceId: string,
    body: { is_archived: true } | { is_visible: false },
    action: "보관" | "삭제",
  ): Promise<void> {
    if (!sourceId.trim()) throw new Error(`${action} 대상 대화 ID가 없습니다`);

    const authToken = await token();
    const response = await fetchImpl(conversationMutationUrl(sourceId), {
      method: "PATCH",
      credentials: "include",
      cache: "no-store",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 401 || response.status === 403) {
      accessToken = null;
    }
    if (!response.ok) throw await mutationError(response, action);
  }

  return {
    capabilities,
    archive(sourceId: string) {
      return patch(sourceId, { is_archived: true }, "보관");
    },
    delete(sourceId: string) {
      return patch(sourceId, { is_visible: false }, "삭제");
    },
  };
}

/** Fail-closed adapter retained for fixtures/tests and compatibility fallback. */
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
