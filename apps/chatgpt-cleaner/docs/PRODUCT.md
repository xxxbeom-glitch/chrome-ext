# ChatGPT Cleaner + Message Vault — Product Definition

Status: MVP product contract

## 1. Product purpose

The extension has two independent jobs:

1. **Cleaner** — discover ChatGPT conversation history and let the user archive or delete conversations quickly and explicitly.
2. **Message Vault** — save a specific ChatGPT question or answer as an independent user-owned item.

The two features must never be coupled. Saving a message does not archive/delete its source conversation, and archiving/deleting a source conversation does not delete a saved Vault item.

## 2. Product principles

- Cleanup must be faster than ChatGPT's one-by-one management flow.
- Destructive actions are explicit, scoped, and itemized.
- Delete always requires confirmation; Archive does not.
- A bookmark means **this one message**, not the whole conversation.
- Source conversation title/URL/ID are provenance metadata only.
- Saved items remain readable independently of the ChatGPT source.
- Never claim a save, archive, delete, or full-history result that was not confirmed.
- Host/private-web compatibility assumptions stay isolated and fail visibly on drift.

## 3. Information architecture

### A. Chrome action popup

Compact launcher:
- ChatGPT 열기
- 대화방 정리하기
- 북마크한 대화 / 북마크 보관함
- account/sync/settings state

The popup is not the main management workspace.

### B. Cleanup modal

Centered overlay inside ChatGPT:
- search
- loading/discovery/completeness state
- select all loaded results
- per-row checkbox
- per-row 보관 / 삭제
- bulk 보관 / 삭제
- selected count
- exact delete confirmation
- itemized progress/failure/retry state

### C. Inline message bookmark

Inject one extension-owned bookmark control into supported ChatGPT user/assistant turn action rows.

Clicking a bookmark means:
1. identify the exact user question or assistant answer that owns the clicked control;
2. capture only that message's structured content;
3. attach source-conversation metadata for provenance;
4. upsert one Vault item for that source message;
5. show success only after persistence succeeds.

It must **not** capture preceding/following messages merely because they are in the same conversation.

### D. Vault page

Message-centric library:
- list saved questions/answers independently;
- identify role as 질문 / 답변;
- show content preview, source conversation title, saved/updated time;
- open one saved item independently;
- open the source ChatGPT conversation when still available;
- delete only the Vault item with confirmation.

## 4. Cleaner flows

### Single Archive
1. User clicks 보관 on one conversation.
2. Archive executes without irreversible confirmation.
3. Success updates/removes the row; failure stays visible and retryable.

### Single Delete
1. User clicks 삭제.
2. Confirmation clearly identifies the target.
3. Only explicit confirmation performs the destructive request.
4. Failure stays visible and retryable.

### Bulk operations
- Freeze the selected target IDs at execution time.
- Archive has no confirmation requirement beyond the visible selected count.
- Delete requires exact target-count confirmation.
- Partial success is allowed and must be reported per item.
- Never silently retry a destructive request in a way that can duplicate or desynchronize effects.

### Discovery completeness

The primary discovery adapter may enumerate account history through the same-origin ChatGPT web requests used by the site. Visible sidebar rows are only a fallback slice.

UI states must distinguish loading, partial/has-more, end-confirmed, and failure. Say `전체` only after end-of-list is positively confirmed.

## 5. Message Vault flows

### Save one answer
- User clicks the bookmark on an assistant response.
- Only that assistant response becomes a Vault item.
- Other questions/answers in the same conversation are not copied.

### Save one question
- User clicks the bookmark on a user turn when the current ChatGPT UI exposes a compatible turn action cluster.
- Only that user question becomes a Vault item.
- If the host UI does not expose a safe injection anchor, fail visibly rather than attaching to the wrong turn.

### Re-save the same message
- Canonical identity is the source conversation + stable source message key for the extension user.
- Re-saving does not create a duplicate row.
- The saved content may be refreshed in place.

### Multiple bookmarks in one conversation

Three different saved messages in one ChatGPT conversation produce three independent Vault items. There is no conversation-level snapshot or bookmark-anchor container in the canonical V1 model.

### Source archived/deleted later

The saved item remains available because its content is extension-owned data. The source URL may stop resolving; that must not break the Vault reader.

## 6. V1 saved-message content

Each Vault item preserves, where detectable:
- role: user/assistant;
- source message ID or deterministic fallback key;
- source conversation ID/title/URL as metadata;
- message ordinal as auxiliary provenance;
- paragraphs/text;
- headings;
- lists;
- quotes;
- code blocks and language hint;
- tables;
- links and visible labels;
- safe unsupported-media/file placeholders;
- capture/save timestamps.

Canonical storage is structured data, not raw executable ChatGPT HTML.

### V1 media scope

Generated image/file binaries and uploaded-file binaries are not copied in V1. If visible in the **selected message**, preserve safe placeholder/metadata where practical. Do not scan or save media from other messages in the conversation.

### V1.1 generated media/file backup

After MVP stability, supported ChatGPT-generated images and downloadable files may be backed up only when they belong to the selected saved message. Store durable binaries in private extension-owned object storage; never treat expiring ChatGPT URLs as the backup.

### V2 uploaded-source backup

User-uploaded source files may later be optional and quota-aware. They are not part of MVP.

## 7. Data/duplicate policy

Canonical V1 entity: `vault_items`.

One row represents one saved message. Recommended unique identity:
`(user_id, source_conversation_id, source_message_key)`.

Legacy `vault_conversations` and `bookmarks` data may remain temporarily for rollback/migration, but new runtime saves must not write whole-conversation snapshots.

## 8. Auth/cloud

Default backend: Supabase.
Default sign-in: Google OAuth through Supabase Auth (PKCE extension flow).

- RLS scopes every user-data row to `auth.uid()`.
- Cloud is the source of truth for signed-in Vault data.
- Local fallback uses extension local storage and never `chrome.storage.sync` for message bodies.
- Never persist ChatGPT bearer/session credentials or transmit them to Supabase.

## 9. Visual direction

- shared design system + Pretendard Variable;
- light/dark/system;
- compact neutral productivity UI;
- avoid excessive rounding/gradients;
- injected UI remains isolated from ChatGPT styling;
- destructive Delete remains visually distinct.

## 10. Out of scope for MVP

- Safari/Firefox/mobile;
- automatic whole-account backup;
- whole-conversation Vault snapshots;
- automatic delete after save;
- media/file binary backup;
- version history;
- AI summarization/tags;
- sharing/public links;
- team collaboration;
- restoring Vault content back into ChatGPT.

## 11. MVP success criteria

MVP is successful when the user can:
1. load the real ChatGPT conversation list and safely archive/delete selected conversations;
2. save one question or one answer without copying the rest of its conversation;
3. save multiple independent messages from the same conversation without duplication;
4. read a saved message after its source conversation is unavailable;
5. restore cloud Vault items after signing in on another Chrome environment;
6. operate without silent destructive failures or false save/completeness claims.
