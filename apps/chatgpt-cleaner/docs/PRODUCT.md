# ChatGPT Cleaner + Conversation Vault — Product Definition

Status: MVP product contract
Working name: ChatGPT Cleaner + Conversation Vault

## 1. Product purpose

Help the user keep ChatGPT usable at scale by separating two jobs:

1. **Cleaner** — quickly archive or delete unwanted ChatGPT conversations.
2. **Conversation Vault** — preserve selected conversations as independent cloud snapshots that remain available even if the ChatGPT original is later archived or deleted.

The product is private-first and initially optimized for one user, but data ownership is user-scoped so multi-user support does not require a redesign.

## 2. Product principles

- Cleanup must be faster than ChatGPT's one-by-one management flow.
- Destructive actions must be explicit, scoped, and recoverably reported.
- Saving to the Vault is never coupled to deleting the ChatGPT original.
- A saved conversation must remain readable without the original ChatGPT conversation.
- The extension should feel native to ChatGPT without copying or depending on ChatGPT styling internals.
- The popup is a launcher; long workflows live in dedicated surfaces.
- When host compatibility is uncertain, fail closed rather than guessing.

## 3. Information architecture

### A. Chrome action popup

A compact hub with these primary actions:

- **Open ChatGPT** — focus/open `chatgpt.com`.
- **Clean up conversations** — open/focus ChatGPT and request the injected cleanup modal.
- **Bookmarked conversations** — open the extension-owned Vault page.

Secondary area:
- signed-in account state;
- sync state;
- settings/sign out.

The popup must not become the main list-management screen.

### B. ChatGPT cleanup modal

Centered overlay/modal injected into ChatGPT.

Required structure:
- title and close action;
- search/filter input;
- loading/discovery state;
- select-all control for currently loaded results;
- selected-count summary;
- scrollable conversation list;
- checkbox per row;
- conversation title and optional date/meta;
- per-row Archive icon/action;
- per-row Delete icon/action;
- bulk Archive and Delete actions;
- operation progress and itemized result/failure state.

### C. Inline bookmark action

Inject one extension-owned bookmark/save action beside the existing assistant-response action row.

Clicking it means:
1. identify the current source conversation;
2. capture a complete structured snapshot of the conversation as of that moment;
3. save/update the cloud snapshot;
4. add the clicked assistant response as a bookmark anchor;
5. show success only when persistence is confirmed.

### D. Vault page

Extension-owned page opened from the popup.

V1 capabilities:
- list saved conversations;
- search by title/basic text if practical;
- show saved/updated time and bookmark count;
- open a saved conversation independently of ChatGPT;
- jump to bookmark anchors inside the saved snapshot;
- open the source ChatGPT URL when it still exists;
- delete the Vault copy with confirmation.

## 4. Core user flows

### Flow 1 — Bulk cleanup

1. User chooses `Clean up conversations` from the popup.
2. Extension opens/focuses ChatGPT and displays the cleanup modal.
3. Extension discovers conversations progressively.
4. User searches and selects rows.
5. User chooses Archive or Delete.
6. Archive executes without irreversible confirmation.
7. Delete shows exact target count and requires explicit confirmation.
8. Operation runs with bounded concurrency.
9. Successes disappear/update; failures remain visible and selected for retry.

### Flow 2 — Single-row cleanup

1. User clicks Archive or Delete at the right edge of a conversation row.
2. Archive executes directly with progress feedback.
3. Delete requires confirmation naming or otherwise clearly identifying the target.
4. Failure is reported on that row.

### Flow 3 — Save/bookmark a conversation

1. User reads a ChatGPT assistant response.
2. User clicks the injected bookmark/save icon below that response.
3. Extension validates that the whole current conversation can be captured completely enough for the V1 snapshot contract.
4. Extension saves/updates the conversation snapshot in the Vault.
5. The clicked response becomes a bookmark anchor.
6. Repeated bookmarks in the same source conversation reuse the same snapshot record and add anchors.

### Flow 4 — Re-save later

If the same source conversation continues after an earlier save:
- a new bookmark triggers a fresh complete capture;
- the current Vault snapshot is updated to the newer complete state;
- existing bookmark anchors remain;
- the new anchor is added;
- an incomplete capture must never overwrite the last complete snapshot.

### Flow 5 — Original deleted later

- Deleting/archiving a ChatGPT original has no effect on the Vault record.
- Vault content remains readable after source deletion.
- The original-source link may become unavailable; this must not break Vault rendering.

### Flow 6 — New PC

1. Install extension.
2. Sign into the extension account.
3. Vault data syncs from cloud.
4. Saved conversations are readable without ChatGPT login.
5. ChatGPT login is only needed to create new snapshots or manipulate source conversations.

## 5. Cleaner behavior policy

### Archive
- single Archive: no confirmation;
- bulk Archive: no confirmation, but show selected count before execution;
- report partial failures explicitly.

### Delete
- single Delete: explicit confirmation;
- bulk Delete: explicit confirmation including exact target count;
- no hidden retry that could duplicate/desynchronize effects;
- no `Save then automatically delete` workflow in V1.

### Discovery completeness

Product goal: manage the user's complete ChatGPT conversation history when the available adapter can enumerate it reliably.

The UI must distinguish:
- `loading more`;
- `N conversations discovered`;
- `end of list confirmed`.

Never label a selection as `all conversations` unless the adapter has positively reached the end of the available account list. Otherwise use wording such as `all loaded conversations`.

## 6. Vault snapshot semantics

One source ChatGPT conversation maps to one current Vault snapshot per extension user.

V1 snapshot content:
- user messages;
- assistant messages;
- text/paragraph structure;
- Markdown semantics that can be reconstructed safely;
- headings/lists/quotes when detectable;
- code blocks and language hint when detectable;
- tables represented structurally or losslessly enough to render;
- links and visible labels;
- conversation title;
- source conversation identifier when available;
- source URL;
- saved/updated timestamps;
- ordered message positions;
- bookmark anchors.

Out of V1 snapshot scope:
- uploaded file binaries;
- generated image binaries;
- voice/audio;
- Canvas/artifact application state;
- third-party tool interactive widgets;
- exact pixel-perfect reproduction of ChatGPT UI.

If excluded media is visible, preserve a safe textual placeholder/metadata when practical rather than pretending the binary was archived.

## 7. Duplicate/update policy

- Same source conversation + new bookmark: update the current complete snapshot and add/reuse the bookmark anchor.
- Same message bookmarked again: do not create duplicate anchors by default.
- Snapshot version history is out of V1.
- A future versioning feature may be added without changing the source-conversation identity model.

## 8. Auth and cloud default

Default backend: **Supabase**.
Default sign-in: **Google OAuth through Supabase Auth**.

Reasoning:
- user-scoped relational data;
- Row Level Security;
- JSONB snapshot storage;
- future search/tag relationships;
- straightforward cross-device sync.

If external credentials/project setup are unavailable during implementation, Cursor must finish all code/schema/setup instructions that can be completed locally, then create a precise `BLOCKED` or `DECISION_NEEDED` handoff instead of inventing credentials.

## 9. Visual direction

- Use shared `@chrome-ext/design-system`.
- Pretendard Variable.
- Light/dark/system support.
- Compact, neutral productivity UI.
- Avoid excessive rounding, gradients, decorative effects, or visual mimicry that depends on ChatGPT CSS.
- Injected UI must be style-isolated.

## 10. Out of scope for MVP

- Safari/Firefox support.
- Mobile support.
- automatic full-account Vault backup without user action.
- automatic deletion after Vault save.
- media/file binary backup.
- snapshot version history.
- AI summarization/tag generation.
- sharing/public links.
- team/multi-user collaboration.
- restoring a deleted Vault snapshot back into ChatGPT.
- changing ChatGPT account settings.

## 11. MVP success criteria

The MVP is successful when the user can:
1. open one cleanup modal and safely archive/delete multiple ChatGPT conversations;
2. save a complete-enough V1 conversation snapshot from an inline response action;
3. later delete the ChatGPT original while the Vault copy remains readable;
4. sign in on another Chrome environment and recover the Vault data;
5. use the system without silent destructive failures or false `saved`/`all loaded` claims.