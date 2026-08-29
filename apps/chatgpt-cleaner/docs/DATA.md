# ChatGPT Cleaner + Message Vault — Data Contract

## 1. Backend and ownership

Default backend: Supabase. Default auth: Google OAuth through Supabase Auth.

Every cloud user-data row is owned by `auth.uid()` and protected by RLS. The extension ships only client-safe/publishable Supabase configuration; never a service-role key.

## 2. Canonical V1 entity: `vault_items`

One row represents one independently saved ChatGPT message.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `source_conversation_id text not null`
- `source_url text`
- `source_conversation_title text not null`
- `source_message_id text`
- `source_message_key text not null`
- `role text not null` (`user|assistant|system|tool|unknown`)
- `message_ordinal integer not null`
- `content jsonb not null`
- `captured_at timestamptz not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Unique identity:
- `(user_id, source_conversation_id, source_message_key)`.

`source_message_key` uses a stable source message ID when available. When ChatGPT does not expose one, the adapter may use a deterministic role/ordinal fallback and must treat that fallback as more fragile.

## 3. Legacy tables

The original MVP prototype used:
- `vault_conversations`
- `bookmarks`

Those tables may remain temporarily in the database for rollback/data inspection. **New runtime writes do not use them.** Do not drop legacy data as part of the message-level migration unless a later explicit cleanup decision is made.

Local fallback follows the same rule: the new storage key is separate from legacy whole-conversation local records so rollback remains possible.

## 4. Saved-message JSON

`content` stores blocks for only the selected message, never the whole conversation.

Conceptual row payload:

```json
{
  "sourceConversationId": "c123",
  "sourceConversationTitle": "Example chat",
  "sourceMessageId": "m456",
  "sourceMessageKey": "msg:m456",
  "role": "assistant",
  "messageOrdinal": 7,
  "content": [
    { "type": "paragraph", "text": "..." },
    { "type": "code", "language": "ts", "text": "..." },
    { "type": "link", "href": "https://...", "label": "..." }
  ]
}
```

V1 block vocabulary:
- paragraph/text
- heading
- list
- quote
- code
- table
- link
- unsupported-media placeholder

Do not store arbitrary raw ChatGPT HTML/scripts as canonical content.

## 5. Save transaction

For a clicked message bookmark:
1. resolve the exact owning user/assistant turn;
2. capture only that message's structured blocks;
3. derive source conversation metadata and source message key;
4. choose cloud or local backend;
5. upsert one `vault_items` row by canonical unique identity;
6. return success only after persistence confirmation.

Re-saving the same message updates that row instead of creating a duplicate. Different messages in the same conversation are independent rows.

## 6. Local/cloud routing

Canonical runtime path is `lib/domain/vault/service.ts`:
- signed in + configured -> `SupabaseCloudVaultRepository`
- unsigned/unconfigured -> `LocalVaultRepository`
- cloud save failure -> failure; never claim a local save as if it were cloud success

The local V2 message storage key intentionally does not overwrite/read the old whole-conversation local storage key.

## 7. RLS contract

For `vault_items`:
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

Cross-user access must fail even when request parameters are manipulated.

## 8. ChatGPT session data

ChatGPT private-web discovery/mutation may obtain a bearer token from the same-origin session endpoint for the current operation.

Rules:
- memory only;
- never `chrome.storage`;
- never logs/issues/commits;
- never Supabase;
- never analytics/third party;
- clear cached token after auth failure;
- no destructive automatic retry.

## 9. Cleaner mutation data

Archive/Delete modify only the ChatGPT source conversation. They do not alter `vault_items`.

Archive request semantics currently bound behind the ChatGPT private-web adapter:
- conversation ID + `is_archived: true`.

Delete request semantics:
- conversation ID + `is_visible: false`.

These are host-private web contracts, not stable public APIs. Request/response drift must surface as a failed item, not a false success.

## 10. Deletion domains

### Delete ChatGPT source
- does not delete any `vault_items` rows.

### Delete Vault item
- requires confirmation;
- deletes only that one user-owned `vault_items` row;
- does not mutate ChatGPT.

The UI must keep these two deletion domains visually/textually distinct.

## 11. V1 media placeholder rules

Only media/files inside the selected saved message are considered.

V1 stores safe placeholder/metadata where detectable and must never imply that a binary was backed up. Do not persist expiring/authenticated ChatGPT URLs merely to make a placeholder downloadable.

## 12. V1.1 planned `vault_media`

When generated-media backup is implemented, associate media with a saved `vault_items` item, not with an entire conversation.

Conceptual fields:
- `id`
- `user_id`
- `vault_item_id` (FK -> `vault_items`)
- `source_message_id`
- `media_kind`
- `filename`
- `mime_type`
- `byte_size`
- `content_hash`
- `storage_bucket`
- `storage_path`
- `created_at`

Binary bytes live in a private Supabase Storage bucket; Postgres holds metadata only. Storage access remains user-scoped/authenticated. Never treat the source ChatGPT URL as the durable copy.

## 13. Auth/environment

Canonical public config:

```text
WXT_PUBLIC_SUPABASE_URL=
WXT_PUBLIC_SUPABASE_ANON_KEY=
WXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL=
```

Auth contract: Supabase OAuth PKCE + `chrome.identity.launchWebAuthFlow` + `exchangeCodeForSession`.

Never commit service-role keys, Google client secrets, ChatGPT session tokens/cookies, or private user exports.
