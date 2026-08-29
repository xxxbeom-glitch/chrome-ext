# ChatGPT Cleaner + Message Vault — Technical SPEC

Status: implementation contract

## 1. Single purpose

Help the user clean up ChatGPT conversations and independently save selected ChatGPT questions/answers as user-owned Vault items.

## 2. Host/cloud boundaries

Required host: `https://chatgpt.com/*`.
Cloud: one configured Supabase project.
No `<all_urls>` or wildcard cloud hosts.

## 3. Entrypoints

- background: privileged coordination/auth/tab routing
- content script: ChatGPT discovery, mutation adapter, bookmark injection, cleanup overlay
- popup: launcher/account state
- extension Vault page: saved-message library/reader

## 4. ChatGPT discovery

Visible sidebar links are not account history. Primary discovery uses same-origin private-web calls behind the adapter boundary:
1. `GET /api/auth/session` -> access token in memory only
2. paginated `GET /backend-api/conversations`

DOM `/c/` links are fallback-only and never prove end-of-list.

Response schema is validated. Drift -> failed/partial discovery, not fake empty/full history.

## 5. Live Archive/Delete adapter

Current private-web binding, isolated in `lib/adapters/chatgpt/mutations.ts`:
- Archive: `PATCH /backend-api/conversation/{id}` with `{ "is_archived": true }`
- Delete: `PATCH /backend-api/conversation/{id}` with `{ "is_visible": false }`

These are private ChatGPT web contracts, not public stable APIs.

Rules:
- bearer/session data is memory-only and never logged/stored/transmitted to Supabase;
- request failure stays an item failure;
- no hidden automatic retry for destructive PATCH requests;
- Archive never falls through to Delete;
- Delete is only invoked after extension UI confirmation;
- capability/request drift must fail visibly;
- manual live smoke uses intentionally disposable conversations only.

## 6. Cleanup domain

Each list item is keyed by stable source conversation ID.

Bulk operations:
- freeze target IDs at execution time;
- bounded concurrency;
- per-item pending/running/succeeded/failed/skipped;
- failed items remain visible/retryable;
- Archive and Delete are distinct commands;
- Delete confirmation contains exact target count.

## 7. Cleanup modal

- centered injected overlay, not side panel;
- style isolated;
- search, selection, loaded-count/completeness, per-row and bulk actions;
- loading/error/partial-failure states explicit;
- `전체` wording only when end is positively confirmed;
- Delete confirmation does zero mutation on cancel.

## 8. Bookmark injection

Bookmarks are message-level.

The adapter locates current ChatGPT turn action clusters from `copy-turn-action-button` / compatible localized turn-copy controls plus legacy fixture fallbacks.

Supported target roles: `user`, `assistant`.

Requirements:
- one bookmark button per compatible turn action row;
- resolve the exact owning message element before injection;
- stable message ID when present, deterministic role/ordinal key only as fallback;
- idempotent across SPA rerender/MutationObserver runs;
- no event bubbling into native ChatGPT controls;
- place after More or before Sources when detectable;
- labels/status: `보관함에 저장`, `저장 중`, `저장됨`, `다시 시도`;
- if a user/assistant turn has no safe action-row anchor, do not attach to a neighboring message.

## 9. Message capture contract

Canonical save API: `captureMessage(document, target)`.

It captures only the clicked message:

```ts
interface MessageSnapshot {
  sourceConversationId: string;
  sourceUrl: string;
  sourceConversationTitle: string;
  sourceMessageId?: string;
  sourceMessageKey: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'unknown';
  messageOrdinal: number;
  capturedAt: string;
  blocks: SnapshotBlock[];
}
```

V1 block types:
- paragraph
- heading
- list
- quote
- code + language hint
- table
- link
- unsupported-media placeholder

Never save arbitrary executable host HTML. The legacy `captureCurrentConversation()` helper may remain only for migration/fixture compatibility; the runtime bookmark path must not call it.

## 10. Vault identity/storage

Canonical cloud table: `vault_items`.

Unique identity:
`(user_id, source_conversation_id, source_message_key)`.

Three different messages saved from one conversation -> three independent rows. Re-saving the same source message -> upsert same row.

Legacy `vault_conversations` / `bookmarks` remain untouched for rollback and are not the new runtime write target.

Local fallback uses a new storage key separate from legacy whole-conversation records.

## 11. Vault reader

Vault UI is message-centric:
- list item role (`질문` / `답변`), preview, source conversation title, timestamp;
- detail renders only the selected saved message;
- source ChatGPT link is provenance and may later fail;
- deleting a Vault item deletes only that saved item;
- no ChatGPT DOM/CSS dependency for rendering;
- captured text is rendered through safe nodes and sanitized links.

## 12. Media semantics

V1: only media/files inside the selected message may produce safe placeholder/metadata. Do not scan/save media from other turns.

V1.1: generated image/file binary backup attaches to `vault_item_id` and private object storage. A binary is not considered backed up until persistence succeeds.

## 13. Supabase/RLS

`vault_items` is user-scoped:
- SELECT/INSERT/UPDATE/DELETE only for `auth.uid() = user_id`.

Auth remains Supabase OAuth PKCE using `chrome.identity.launchWebAuthFlow` + `exchangeCodeForSession`.

No service-role key, Google client secret, ChatGPT cookie/token, or private export in repo/client logs.

## 14. Failure behavior

### Discovery
Schema/network failure -> explicit failed/partial state; DOM fallback may show only visible rows and never claims full history.

### Archive/Delete
HTTP/schema/auth failure -> item failed; no success claim; no destructive hidden retry.

### Bookmark save
Capture/persistence failure -> `다시 시도`; do not claim `저장됨`.

### Cloud list
A cloud list error may fall back to local data only if the UI/backend state does not misrepresent local rows as cloud-synced.

## 15. Permissions

Minimum permissions only. Current architecture must not add `scripting`, `cookies`, or `<all_urls>` merely for these features. Same-origin ChatGPT content-script requests use the existing host access.

## 16. Acceptance criteria

- signed-in account history loads independently of sidebar visibility;
- single/bulk Archive works with itemized outcomes;
- single/bulk Delete requires defined confirmation and itemized outcomes;
- real destructive smoke is performed only on disposable targets;
- assistant answer bookmark saves only that answer;
- user question bookmark saves only that question when a safe turn action row exists;
- different messages in one conversation become independent Vault items;
- same message re-save does not duplicate;
- code/table/link structures survive message capture;
- source Archive/Delete does not remove saved Vault items;
- Vault deletion does not mutate ChatGPT;
- RLS prevents cross-user Vault access;
- repository QA + GitHub Actions pass before merge.
