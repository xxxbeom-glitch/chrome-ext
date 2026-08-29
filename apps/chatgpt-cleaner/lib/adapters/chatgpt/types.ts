export interface ChatGptCapabilities {
  canDiscoverConversations: boolean;
  canConfirmDiscoveryEnd: boolean;
  canArchive: boolean;
  canDelete: boolean;
  canCaptureConversation: boolean;
  canLocateAssistantActions: boolean;
}

export type DiscoveryCompleteness =
  | "loading"
  | "hasMore"
  | "endConfirmed"
  | "unknown";

export interface DiscoveredConversation {
  sourceId: string;
  title: string;
  sourceUrl: string;
  updatedAt?: string;
}

export interface DiscoveryPage {
  items: DiscoveredConversation[];
  completeness: DiscoveryCompleteness;
  nextCursor?: string;
}

export type SnapshotBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; text: string; language?: string }
  | { type: "table"; text: string }
  | { type: "link"; href: string; label: string }
  | { type: "unsupported-media"; label: string };

export interface SnapshotMessage {
  sourceMessageId?: string;
  role: "user" | "assistant" | "system" | "tool" | "unknown";
  ordinal: number;
  blocks: SnapshotBlock[];
}

/** Legacy whole-conversation shape kept only for migration/fixture compatibility. */
export interface ConversationSnapshot {
  sourceConversationId: string;
  sourceUrl: string;
  title: string;
  capturedAt: string;
  completeness: "complete" | "partial";
  messages: SnapshotMessage[];
}

/** Canonical V1 Vault unit: one independently saved ChatGPT message. */
export interface MessageSnapshot {
  sourceConversationId: string;
  sourceUrl: string;
  sourceConversationTitle: string;
  sourceMessageId?: string;
  /** Stable dedupe key even when ChatGPT does not expose a message id. */
  sourceMessageKey: string;
  role: SnapshotMessage["role"];
  messageOrdinal: number;
  capturedAt: string;
  blocks: SnapshotBlock[];
}

export interface BookmarkAnchorTarget {
  key: string;
  sourceMessageId?: string;
  actionRow: Element;
  messageElement: Element;
  role: SnapshotMessage["role"];
}
