export type DiscoveryCompleteness =
  | "loading"
  | "hasMore"
  | "endConfirmed"
  | "unknown";

export type CleanupItemStatus =
  | "idle"
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "skipped";

export interface ConversationListItem {
  sourceId: string;
  title: string;
  sourceUrl?: string;
  updatedAt?: string;
  archived?: boolean;
}

export interface CleanupListItem extends ConversationListItem {
  selected: boolean;
  status: CleanupItemStatus;
  errorMessage?: string;
}

export interface VaultBookmarkAnchor {
  id: string;
  messageOrdinal: number;
  excerpt: string;
}

export interface VaultConversationSummary {
  id: string;
  title: string;
  sourceConversationId: string;
  sourceUrl?: string;
  updatedAt: string;
  bookmarkCount: number;
  completeness: "complete" | "partial";
}

export interface VaultMessageBlock {
  type:
    | "paragraph"
    | "heading"
    | "list"
    | "quote"
    | "code"
    | "table"
    | "link"
    | "unsupported-media";
  text?: string;
  language?: string;
  href?: string;
  label?: string;
  items?: string[];
}

export interface VaultMessage {
  ordinal: number;
  role: "user" | "assistant" | "system" | "tool" | "unknown";
  blocks: VaultMessageBlock[];
}

export interface VaultConversationDetail extends VaultConversationSummary {
  messages: VaultMessage[];
  anchors: VaultBookmarkAnchor[];
}
