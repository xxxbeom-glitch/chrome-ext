# ChatGPT Cleaner + Message Vault — QA Contract

## 1. Critical journeys

1. Popup opens ChatGPT and cleanup modal.
2. Cleanup list loads real account history without depending on visible sidebar rows.
3. Single/bulk Archive reports itemized results.
4. Single/bulk Delete requires confirmation and reports itemized results.
5. Failed destructive requests remain retryable; no hidden destructive retry.
6. Assistant answer bookmark saves only that answer.
7. User question bookmark saves only that question when a safe current turn action row exists.
8. Different saved messages from the same conversation remain independent Vault items.
9. Re-saving the same message does not duplicate a Vault row.
10. Source Archive/Delete does not delete Vault items.
11. Vault deletion does not mutate ChatGPT.
12. Google/Supabase login restores user-owned Vault items in another browser profile.

## 2. Automated gates

Final branch/PR must pass:
- `pnpm verify:repo`
- lint
- typecheck
- unit tests
- production build
- extension E2E

No test/type failure may be ignored to make the gate pass.

## 3. Adapter unit tests

### Discovery
- session token parsing
- conversation-list schema validation
- pagination/end-confirmed semantics
- collapsed/missing DOM fallback
- false-empty prevention

### Archive/Delete
- Archive emits one PATCH with `is_archived: true`
- Delete emits one PATCH with `is_visible: false`
- bearer token is reused only in memory
- 401/403 invalidates cached token
- 4xx/5xx returns failure
- destructive PATCH is not automatically retried
- Archive cannot fall through to Delete

### Bookmark/action rows
- current copy-turn cluster detection
- assistant and user turn role resolution
- code-block copy ignored
- one bookmark control per compatible turn
- rerender/idempotent injection
- click does not bubble to native controls
- missing safe row never binds to adjacent message

### Message capture
- selected user question only
- selected assistant answer only
- other turns absent from saved JSON
- source message ID/key
- role/ordinal provenance
- paragraph/heading/list/quote/code/table/link
- unsupported-media placeholder
- no executable raw HTML

## 4. Vault/data tests

- three different messages from one conversation -> three rows
- same source message re-save -> one row/upsert
- same fallback key in different conversations -> independent rows
- cloud error -> failure, not fake local/cloud success
- `vault_items` RLS: own CRUD only
- unauthenticated and cross-user access denied
- legacy whole-conversation tables are not new runtime write targets
- Vault item delete leaves ChatGPT source untouched

## 5. E2E

Use built unpacked extension with controlled fixtures/stubs where possible:
- extension loads without manifest/service-worker error
- cleanup modal opens/closes
- list loading/error/completeness UI
- per-row/bulk action progress + failure UI
- bookmark button survives MutationObserver rerender
- user + assistant compatible turn injection fixture
- saved-message Vault list/detail render safely
- no captured source HTML execution

Real ChatGPT destructive mutation remains a manual lane. Never mass-delete real user data in automated E2E.

## 6. Manual real-account smoke

Before MVP DONE:
- signed-in history returns non-empty real list when account has chats
- use an intentionally disposable chat for Archive
- verify archived chat actually leaves active history / appears in ChatGPT archive behavior
- use a second intentionally disposable chat for Delete
- confirm Delete first, then verify source is unavailable/removed
- save one harmless assistant answer; Vault contains only that answer
- save one harmless user question if a compatible user action row appears; Vault contains only that question
- verify another message from the same conversation was not copied
- source deletion does not remove the saved Vault item
- restart extension/Chrome and verify persistence
- second profile verifies cloud restore

## 7. Supabase/auth

- migration `202608290002_message_vault_items.sql` applies cleanly
- RLS enabled on `vault_items`
- authenticated own CRUD succeeds
- second user cannot read/write first user's items
- Google OAuth callback returns to extension
- no service-role/client secret in bundle
- no ChatGPT token/cookie persisted or sent to Supabase

## 8. Release blockers

Do not mark MVP DONE if:
- Delete can run without defined confirmation;
- destructive HTTP failure is shown as success;
- UI claims full conversation history without confirmed end;
- bookmark saves more than the selected message;
- same message creates uncontrolled duplicates;
- Vault save success appears before persistence confirmation;
- ChatGPT credentials are persisted/transmitted;
- RLS isolation is unverified;
- Actions/repository QA is red;
- required real destructive smoke has not been performed on disposable targets.

## 9. Result record

Each task Issue records commit/PR, automated QA, manual QA NOT_RUN/PASS/FAIL, residual risks, and review conclusion.
