# ChatGPT Cleaner + Conversation Vault — Data Contract

## 1. Backend

Default backend: Supabase.
Default auth: Google OAuth through Supabase Auth.

The extension must use only client-safe/publishable configuration. Never ship a Supabase service-role key.

## 2. Data ownership

Every cloud record is owned by `auth.uid()` and protected by Row Level Security.

User A must never be able to read/write/delete User B records even if request parameters are manipulated.

## 3. Core tables

### `vault_conversations`

One current snapshot per extension user + source ChatGPT conversation.

Recommended columns:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `source_conversation_id text not null`
- `source_url text`
- `title text not null`
- `snapshot_schema_version integer not null default 1`
- `snapshot jsonb not null`
- `message_count integer not null`
- `completeness text not null check (completeness in ('complete','partial'))`
- `captured_at timestamptz not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraint:
- unique `(user_id, source_conversation_id)`.

A partial snapshot may be used transiently for diagnostics but must not overwrite an existing complete record.

### `bookmarks`

Anchors inside a Vault conversation.

Recommended columns:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `vault_conversation_id uuid not null references vault_conversations(id) on delete cascade`
- `source_message_id text`
- `message_ordinal integer not null`
- `excerpt text`
- `created_at timestamptz not null default now()`

Preferred duplicate prevention:
- unique stable message anchor when `source_message_id` exists;
- otherwise application-level deterministic anchor key based on the conversation + ordinal + capture evidence.

### `user_settings` (optional V1)

Only create if cloud-synced settings are actually needed. Prefer local extension storage for simple theme/UI preferences.

### `vault_media` (planned V1.1, not MVP)

When generated media/file backup is implemented, prefer a dedicated user-scoped metadata table rather than embedding binary data in `snapshot jsonb`.

Conceptual fields:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `vault_conversation_id uuid not null references vault_conversations(id) on delete cascade`
- `source_message_id text`
- `message_ordinal integer`
- `media_kind text` (for example `generated_image`, `generated_file`)
- `filename text`
- `mime_type text`
- `byte_size bigint`
- `content_hash text`
- `storage_bucket text`
- `storage_path text not null`
- `created_at timestamptz not null default now()`

Rules:
- metadata rows are user-scoped and RLS-protected;
- binary bytes live in private extension-owned object storage, not Postgres JSONB;
- storage paths must be user-scoped and non-guessable enough for safe access patterns;
- use signed/authenticated retrieval from the extension, not public buckets by default;
- identical media may be deduplicated by content hash where practical;
- do not store or rely on expiring ChatGPT download URLs as the durable backup reference.

## 4. Snapshot JSON schema

Canonical cloud snapshot is structured JSON, not raw ChatGPT HTML.

Conceptual structure:

```json
{
  "schemaVersion": 1,
  "sourceConversationId": "...",
  "sourceUrl": "https://chatgpt.com/c/...",
  "title": "...",
  "capturedAt": "...",
  "messages": [
    {
      "sourceMessageId": "...",
      "role": "user|assistant|system|tool|unknown",
      "ordinal": 0,
      "blocks": [
        { "type": "paragraph", "text": "..." },
        { "type": "code", "language": "ts", "text": "..." },
        { "type": "link", "href": "https://...", "label": "..." },
        {
          "type": "unsupported-media",
          "mediaKind": "generated_image|generated_file|uploaded_file|audio|artifact|unknown",
          "label": "...",
          "filename": "...",
          "mimeType": "..."
        }
      ]
    }
  ]
}
```

V1 block vocabulary must cover:
- paragraph/text;
- heading;
- ordered/unordered list;
- quote;
- code;
- table;
- link;
- unsupported-media placeholder.

V1 media placeholder rules:
- preserve only safe metadata that is visible or reliably detectable;
- never imply that a binary was backed up when only a placeholder exists;
- do not persist secret-bearing, token-bearing, or expiring authenticated ChatGPT URLs merely to make the placeholder look downloadable;
- `complete` in V1 means complete enough for the text-first V1 contract, not binary-complete.

Do not store executable host markup/scripts.

## 5. Runtime routing (Phase 6+)

Canonical write path is `lib/domain/vault/service.ts`:

- **signed in + configured** → `SupabaseCloudVaultRepository` (cloud upsert; success only after persistence confirmation);
- **unsigned / unconfigured** → `LocalVaultRepository` via `chrome.storage.local` (local fallback; same partial-overwrite protection);
- cloud network/auth failure returns failure (never success) and must not claim a cloud save.

Sign-out clears the Supabase Auth session (PKCE tokens in extension storage). Local offline snapshots are not wiped on sign-out.

## 6. Re-save transaction

When bookmarking a response in an already-saved source conversation:

1. capture a new current conversation snapshot;
2. validate completeness;
3. if complete, upsert `vault_conversations`;
4. upsert the bookmark anchor;
5. preserve existing bookmarks;
6. return success only after cloud persistence completes.

If capture is partial:
- do not overwrite an existing complete snapshot;
- do not claim full Vault success;
- return a recoverable failure/warning.

Where practical, snapshot upsert + bookmark insertion should be executed through a transaction/RPC or otherwise designed so a failure cannot silently create misleading mixed state.

### Planned V1.1 media transaction semantics

When generated media/file backup is added:
1. the bookmark still triggers a whole-conversation snapshot, not a single-message-only backup;
2. enumerate supported generated media/files in the captured conversation;
3. retrieve each binary only through evidence-backed, authenticated source behavior;
4. upload the durable copy to private Supabase Storage;
5. persist/update `vault_media` metadata and link it back to the conversation/message;
6. only mark that media item as backed up after storage persistence succeeds;
7. a failed media copy must remain visibly failed/unsupported rather than silently claiming a complete binary backup;
8. reuse already-persisted identical media where practical.

The text snapshot may remain valid even if an optional V1.1 media item fails, but the UI must distinguish text snapshot completeness from media backup completeness.

## 7. RLS contract

Enable RLS on every user-data table.

Required policy semantics for `vault_conversations`, `bookmarks`, and future `vault_media`:
- SELECT only where `user_id = auth.uid()`;
- INSERT only where `user_id = auth.uid()`;
- UPDATE only where `user_id = auth.uid()`;
- DELETE only where `user_id = auth.uid()`.

Private Storage policies for V1.1 must enforce the same user ownership boundary for object read/write/delete operations.

Cursor must create version-controlled migration SQL under the app (for example `supabase/migrations/`) rather than relying only on dashboard clicks.

## 8. Auth flow

Target flow:

```text
Chrome extension
  ↓ Google sign in
Supabase Auth
  ↓ user session
RLS-protected Vault API
```

Use an extension-safe OAuth redirect URI. Document the exact redirect generated by the implementation and the Google/Supabase dashboard configuration steps.

If the external project is not configured yet, implementation should still provide:
- `.env.example` without secrets;
- migration SQL;
- typed Supabase client wrapper;
- auth callback handling;
- setup instructions;
- mock/local adapter for tests where useful.

Then stop only the real-cloud E2E gate with an explicit blocker requiring the user's setup.

## 9. Environment values

Canonical client configuration names (WXT public env only):

```text
WXT_PUBLIC_SUPABASE_URL=
WXT_PUBLIC_SUPABASE_ANON_KEY=
WXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL=   # optional; prefer chrome.identity.getRedirectURL()
```

Do not use `VITE_SUPABASE_*` names in this app.

Auth contract: Supabase OAuth PKCE + `chrome.identity.launchWebAuthFlow` + `exchangeCodeForSession`.
Do not mix with `signInWithIdToken`.

These are client-publishable values, not service-role secrets.

Never commit:
- service-role key;
- Google client secret;
- ChatGPT session token/cookie;
- private user exports.

## 10. Deletion semantics

### Deleting ChatGPT original
- does not alter Vault data.

### Deleting Vault conversation
- explicit confirmation required;
- deletes the Vault snapshot and cascades its bookmark anchors;
- when V1.1 exists, also removes or schedules removal of media metadata and owned Storage objects that are no longer referenced;
- does not alter the ChatGPT original.

The UI must make these two deletion domains visually/textually distinct.

## 11. Sync/cache semantics

Cloud is source of truth for Vault data.

Local extension storage may cache:
- Vault list metadata;
- last sync timestamp;
- UI/theme preferences;
- transient operation state.

Rules:
- stale cache must be recognizable;
- sign-out clears user-specific cache/session material;
- a cache failure must not delete cloud data;
- never use `chrome.storage.sync` for full snapshot bodies or media binaries.

## 12. Future-compatible fields

Do not implement unless required, but preserve schema room for:
- tags;
- user notes;
- full-text search index;
- snapshot version history;
- stored media references;
- media backup status / error state;
- user storage quota/accounting;
- optional uploaded-source-file backup.

Roadmap contract:
- **V1:** text/structured-content snapshot + safe media/file placeholders/metadata;
- **V1.1:** generated images and generated downloadable files copied to private extension-owned Storage;
- **V2:** optional, quota-aware backup of user-uploaded source files.

These are explicitly out of MVP unless promoted by a later product decision and must not delay V1.