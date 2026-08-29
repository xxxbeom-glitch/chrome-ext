# ChatGPT Cleaner + Conversation Vault — Technical SPEC

Status: implementation-ready baseline, subject only to explicit GitHub decisions.

## 1. Single purpose

Help the user clean up ChatGPT conversations while preserving selected conversations as independent user-owned cloud snapshots.

## 2. Target hosts

Required:
- `https://chatgpt.com/*`

Cloud API:
- one configured Supabase project endpoint.

No wildcard host access is allowed.

## 3. Entrypoints

Required V1 entrypoints:

- **background service worker** — privileged coordination, cross-origin cloud requests when needed, auth/session coordination, operation queue ownership.
- **content script** — ChatGPT compatibility probing, read-only discovery/parsing, injection host for cleanup modal and bookmark action, narrow bridge to background/domain commands.
- **popup** — lightweight launcher only.
- **extension-owned Vault page** — saved-conversation library/reader.

Not required in V1:
- side panel;
- options page unless settings outgrow the popup/Vault shell.

## 4. Default module shape

```text
apps/chatgpt-cleaner/
├─ entrypoints/
│  ├─ background.ts
│  ├─ content.ts
│  ├─ popup/
│  └─ vault/
├─ lib/
│  ├─ adapters/chatgpt/
│  │  ├─ compatibility.ts
│  │  ├─ discovery.ts
│  │  ├─ snapshot.ts
│  │  ├─ mutations.ts
│  │  ├─ dom/
│  │  └─ private-web/        # only if required
│  ├─ domain/
│  │  ├─ cleanup/
│  │  └─ vault/
│  ├─ messaging/
│  ├─ storage/
│  ├─ supabase/
│  └─ ui/
├─ tests/
│  ├─ fixtures/chatgpt/
│  ├─ unit/
│  └─ e2e/
└─ docs/
```

Only create modules that become necessary; keep this boundary even if the exact file split changes.

## 5. Runtime architecture

Preferred command flow:

```text
Popup / injected UI / Vault page
        ↓ typed validated command
content or background coordinator
        ↓ domain operation
ChatGPT adapter OR Supabase adapter
        ↓ typed result
UI state + durable storage
```

Rules:
- entrypoints remain thin;
- page-derived data is untrusted;
- messages crossing content/background/UI boundaries use typed runtime validation;
- service-worker globals are never durable state;
- destructive queues have explicit operation IDs and per-item results.

## 6. ChatGPT adapter contract

ChatGPT-specific behavior must not leak into generic domain/UI code.

The adapter exposes capabilities approximately equivalent to:

```ts
interface ChatGptCapabilities {
  canDiscoverConversations: boolean;
  canConfirmDiscoveryEnd: boolean;
  canArchive: boolean;
  canDelete: boolean;
  canCaptureConversation: boolean;
  canLocateAssistantActions: boolean;
}
```

Conceptual operations:
- probeCompatibility()
- discoverConversations(cursor?)
- archiveConversation(id)
- deleteConversation(id)
- captureCurrentConversation()
- locateBookmarkAnchors()

The exact signatures may evolve, but compatibility must be explicit and destructive operations must require positive capability checks.

## 7. Discovery strategy

Goal: progressively enumerate as much of the user's ChatGPT conversation history as the current host implementation can reliably expose.

Implementation may use one or more adapters:

1. **DOM/UI adapter** — safe/default for visible host interaction and action-row injection.
2. **private-web adapter** — may be investigated/used when required for reliable account-history pagination or mutation, but only behind the adapter boundary.

If a private/undocumented web endpoint is used:
- document endpoint purpose and assumptions in code/docs;
- do not persist cookies, session headers, bearer/session tokens, or other ChatGPT credentials;
- do not transmit those credentials to Supabase or any third party;
- validate response shape before use;
- feature-detect and fail closed on mismatch;
- isolate request construction/parsing under `lib/adapters/chatgpt/private-web/`;
- keep mutation and discovery separately disableable;
- add fixtures/tests for known response shapes;
- never silently fall back from a failed Archive into Delete or vice versa.

Discovery returns explicit completeness state:
- `loading`;
- `hasMore`;
- `endConfirmed`;
- `unknown/incompatible`.

The UI may say `all conversations` only when `endConfirmed === true`.

## 8. Cleanup domain

Conversation item minimum shape:

```ts
interface ConversationListItem {
  sourceId: string;
  title: string;
  sourceUrl?: string;
  updatedAt?: string;
  archived?: boolean;
}
```

Bulk operation requirements:
- immutable snapshot of target IDs at confirmation time;
- bounded concurrency (initial default: 2–4, tune from evidence);
- per-item state: pending/running/succeeded/failed/skipped;
- abort/stop support where practical;
- no duplicate mutation for the same operation ID;
- partial failures remain visible and retryable;
- deleting requires explicit user confirmation;
- Archive and Delete queues are distinct operations.

## 9. Injected cleanup modal

- mount through Shadow DOM or equivalent isolated root;
- modal is centered and overlays ChatGPT content;
- opening it must not navigate away from the current conversation unless discovery architecture truly requires it;
- keyboard escape closes only when no irreversible confirmation is open;
- focus is trapped while modal/confirmation is active;
- selected state belongs to extension UI, not host DOM classes;
- row mutations update by stable source ID, never by visual index alone.

## 10. Bookmark action injection

The extension injects one bookmark/save control near each assistant-response action row.

Requirements:
- injection must be idempotent across SPA navigation and rerender;
- do not duplicate controls when host DOM mutates;
- associate the control with a stable message identifier when available, otherwise use a deterministic capture-time anchor descriptor;
- clicking the control must not invoke ChatGPT's native buttons;
- show `saving`/success/failure state owned by the extension;
- success means cloud persistence (or explicit local-only development mode), not merely DOM capture.

## 11. Snapshot capture contract

`captureCurrentConversation()` must return a structured result, not raw page HTML.

Conceptual shape:

```ts
interface ConversationSnapshot {
  sourceConversationId: string;
  sourceUrl: string;
  title: string;
  capturedAt: string;
  completeness: 'complete' | 'partial';
  messages: SnapshotMessage[];
}

interface SnapshotMessage {
  sourceMessageId?: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'unknown';
  ordinal: number;
  blocks: SnapshotBlock[];
}
```

V1 block types should cover:
- paragraph/text;
- heading;
- list;
- quote;
- code;
- table;
- link;
- unsupported-media placeholder.

Do not store arbitrary raw host HTML as the canonical snapshot.

### Completeness rule

The parser must use evidence to decide whether capture is complete enough for V1. If completeness cannot be established:
- return `partial`;
- do not show final `Saved` as if the snapshot were complete;
- do not overwrite an existing complete cloud snapshot with the partial result;
- surface an actionable error/warning.

## 12. Snapshot identity/update behavior

Canonical source key:
- `(extension_user_id, source_conversation_id)` when a stable source ID exists.

Fallback source identity may use a documented deterministic key only if the source ID is unavailable; that fallback must be marked fragile.

On save:
1. capture complete current snapshot;
2. upsert `vault_conversation` by canonical source key;
3. preserve existing bookmarks;
4. upsert the clicked response bookmark anchor;
5. return persisted record/version timestamp;
6. only then show success.

No automatic version-history table in V1.

## 13. Vault reader

The Vault page renders only sanitized extension-owned snapshot data.

Requirements:
- no dependency on ChatGPT DOM/CSS to render saved content;
- safe renderer for snapshot block types;
- code and links rendered without executing source content;
- external links require normal browser navigation behavior;
- source ChatGPT link is optional and may fail after source deletion;
- bookmark anchors scroll/focus the corresponding saved message;
- Vault deletion affects only the cloud copy and requires confirmation.

## 14. Auth/cloud

Default: Supabase + Google OAuth.

Auth/session rules:
- use extension-safe OAuth redirect flow;
- never put service-role keys in the extension;
- only anon/publishable client configuration may be bundled;
- rely on Supabase Auth user identity + RLS;
- durable user content is cloud-owned; local storage is cache/settings only;
- sign-out clears local auth/cache material appropriate to the client SDK.

## 15. Local storage

Allowed local durable state:
- theme preference;
- popup/UI preference;
- non-sensitive cached Vault metadata if useful;
- migration/schema version;
- transient operation recovery metadata if required.

Do not store ChatGPT session credentials.

## 16. Permissions and host access

See `docs/PERMISSIONS.md`.

No permission may be added only for convenience.

## 17. Failure behavior

### ChatGPT compatibility mismatch
- disable affected capability;
- keep unaffected capability usable when safely separable;
- destructive actions must not run;
- display `ChatGPT changed; this feature needs an adapter update`-style failure, not a generic success/failure ambiguity.

### Network/Supabase failure
- never claim Vault save success;
- allow retry;
- do not delete source data as compensation;
- preserve prior complete snapshot.

### Partial cleanup failure
- completed items remain completed;
- failed items remain selected/visible;
- show itemized errors;
- retry only failed target IDs.

### Service-worker restart
- operation state must be reconstructable from durable/transient storage or fail safely;
- never resume a destructive action blindly if exact operation identity/target state is unknown.

### Permission denial/auth expired
- show exact recovery action;
- do not broaden permissions automatically;
- do not silently fall back to unsafe behavior.

## 18. Security constraints

- no remote executable code;
- no eval/new Function;
- no ChatGPT auth/session exfiltration;
- no Supabase service-role secret in client code;
- sanitize all captured content before rendering;
- no raw innerHTML with captured host content;
- HTTPS only;
- allowlist cloud endpoint;
- RLS mandatory before real user snapshot upload.

## 19. Out of scope

See `PRODUCT.md`; especially media binary backup, version history, automatic account-wide Vault backup, and side-panel UI.

## 20. Acceptance criteria

- popup launches ChatGPT, cleanup modal, and Vault page correctly;
- cleanup modal discovers conversations progressively and represents completeness honestly;
- single/bulk Archive works with itemized outcomes;
- single/bulk Delete requires correct confirmation and has itemized outcomes;
- incompatible ChatGPT shape blocks destructive actions;
- bookmark action injection is idempotent;
- complete V1 snapshot is stored independently of ChatGPT;
- later source archive/delete does not remove Vault data;
- same source conversation updates one snapshot and supports multiple bookmark anchors;
- incomplete capture never overwrites a complete snapshot;
- Google/Supabase sign-in restores Vault data on another browser environment;
- all required QA in `QA.md` passes.