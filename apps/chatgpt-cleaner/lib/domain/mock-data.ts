import type {
  CleanupListItem,
  DiscoveryCompleteness,
  VaultConversationDetail,
  VaultConversationSummary,
} from "./types";

export const MOCK_CLEANUP_ITEMS: CleanupListItem[] = [
  {
    sourceId: "c-1001",
    title: "Refactor auth middleware notes",
    sourceUrl: "https://chatgpt.com/c/c-1001",
    updatedAt: "2026-08-28T10:00:00.000Z",
    selected: false,
    status: "idle",
  },
  {
    sourceId: "c-1002",
    title: "Weekly planning draft",
    sourceUrl: "https://chatgpt.com/c/c-1002",
    updatedAt: "2026-08-27T18:22:00.000Z",
    selected: true,
    status: "idle",
  },
  {
    sourceId: "c-1003",
    title: "SQL migration checklist",
    sourceUrl: "https://chatgpt.com/c/c-1003",
    updatedAt: "2026-08-26T08:11:00.000Z",
    archived: true,
    selected: false,
    status: "failed",
    errorMessage: "UI 상태용 모의 실패",
  },
  {
    sourceId: "c-1004",
    title: "Design token audit",
    sourceUrl: "https://chatgpt.com/c/c-1004",
    updatedAt: "2026-08-25T14:40:00.000Z",
    selected: false,
    status: "idle",
  },
];

export const MOCK_DISCOVERY_COMPLETENESS: DiscoveryCompleteness = "hasMore";

export const MOCK_VAULT_SUMMARIES: VaultConversationSummary[] = [
  {
    id: "vault-1",
    title: "Keep this conversation",
    sourceConversationId: "c-2001",
    sourceUrl: "https://chatgpt.com/c/c-2001",
    updatedAt: "2026-08-28T12:00:00.000Z",
    bookmarkCount: 2,
    completeness: "complete",
  },
  {
    id: "vault-2",
    title: "Partial capture example",
    sourceConversationId: "c-2002",
    updatedAt: "2026-08-27T09:30:00.000Z",
    bookmarkCount: 1,
    completeness: "partial",
  },
];

export const MOCK_VAULT_DETAILS: Record<string, VaultConversationDetail> = {
  "vault-1": {
    ...MOCK_VAULT_SUMMARIES[0]!,
    anchors: [
      {
        id: "anchor-1",
        messageOrdinal: 1,
        excerpt: "Use Shadow DOM for injected cleanup UI.",
      },
      {
        id: "anchor-2",
        messageOrdinal: 3,
        excerpt: "Fail closed when compatibility is unknown.",
      },
    ],
    messages: [
      {
        ordinal: 0,
        role: "user",
        blocks: [{ type: "paragraph", text: "How should injected UI be isolated?" }],
      },
      {
        ordinal: 1,
        role: "assistant",
        blocks: [
          {
            type: "paragraph",
            text: "Use Shadow DOM for injected cleanup UI.",
          },
          {
            type: "code",
            language: "ts",
            text: "const root = host.attachShadow({ mode: 'open' });",
          },
        ],
      },
      {
        ordinal: 2,
        role: "user",
        blocks: [{ type: "paragraph", text: "What about destructive actions?" }],
      },
      {
        ordinal: 3,
        role: "assistant",
        blocks: [
          {
            type: "paragraph",
            text: "Fail closed when compatibility is unknown.",
          },
          {
            type: "link",
            href: "https://chatgpt.com/",
            label: "ChatGPT",
          },
        ],
      },
    ],
  },
  "vault-2": {
    ...MOCK_VAULT_SUMMARIES[1]!,
    anchors: [
      {
        id: "anchor-3",
        messageOrdinal: 0,
        excerpt: "Only a partial mock snapshot.",
      },
    ],
    messages: [
      {
        ordinal: 0,
        role: "assistant",
        blocks: [
          { type: "paragraph", text: "Only a partial mock snapshot." },
          { type: "unsupported-media", label: "image omitted in V1" },
        ],
      },
    ],
  },
};
