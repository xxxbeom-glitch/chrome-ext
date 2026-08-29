import type { ConversationSnapshot } from "../adapters/chatgpt/types";

const PREVIEW_KEY = "ce.vault.localPreview";

export async function saveLocalSnapshotPreview(
  snapshot: ConversationSnapshot,
  anchorKey: string,
): Promise<void> {
  await browser.storage.local.set({
    [PREVIEW_KEY]: {
      savedAt: new Date().toISOString(),
      anchorKey,
      snapshot,
    },
  });
}

export async function loadLocalSnapshotPreview(): Promise<{
  savedAt: string;
  anchorKey: string;
  snapshot: ConversationSnapshot;
} | null> {
  const result = await browser.storage.local.get(PREVIEW_KEY);
  const value = result[PREVIEW_KEY];
  if (!value || typeof value !== "object") return null;
  return value as {
    savedAt: string;
    anchorKey: string;
    snapshot: ConversationSnapshot;
  };
}
