# ChatGPT Cleaner AGENTS.md

This file supplements the repository root `AGENTS.md`. Root security, permission, QA, design-system, and GitHub collaboration rules remain mandatory.

## Product identity

- App slug: `chatgpt-cleaner`
- Working product name: ChatGPT Cleaner + Conversation Vault
- Single purpose: help the user clean up ChatGPT conversations while preserving selected conversations as user-owned cloud snapshots.
- Target host: `https://chatgpt.com/*`

## Mandatory context

Before changing this app, read in order:

1. root `CURRENT.md`
2. the active GitHub Issue
3. root `AGENTS.md` and matching `.cursor/rules/*.mdc`
4. `docs/PRODUCT.md`
5. `docs/SPEC.md`
6. `docs/DATA.md`
7. `docs/PERMISSIONS.md`
8. `docs/QA.md`
9. `docs/EXECUTION_PLAN.md`

## Fixed product boundaries

- The Chrome action popup is a lightweight hub, not the primary conversation-management workspace.
- Conversation cleanup appears as a centered injected overlay/modal inside ChatGPT. Do not replace it with a Chrome side panel.
- The cleanup list supports checkbox selection, per-row Archive/Delete, bulk Archive/Delete, progress, and itemized failures.
- Archive does not require an irreversible confirmation. Delete does.
- A bookmark control is injected near the assistant-response action row.
- Bookmarking saves or updates an independent cloud snapshot of the whole current conversation and records the selected response as an anchor.
- Deleting or archiving the original ChatGPT conversation must not delete the Vault snapshot.
- V1 snapshot scope is text, Markdown structure, code blocks, tables, and links. Uploaded/generated media binaries are out of scope unless a later decision changes this.
- The same source conversation maps to one current snapshot by default; additional bookmarks add anchors and a later valid save updates the snapshot.
- Never overwrite a known-complete snapshot with an incomplete capture.

## Architecture boundaries

- Put all ChatGPT-specific selectors, DOM parsing, private-web assumptions, and mutations under `lib/adapters/chatgpt/`.
- Keep injected content-script entrypoints thin.
- Use Shadow DOM or an equivalent strong isolation boundary for injected extension UI.
- Use `@chrome-ext/design-system` and Pretendard for extension-owned UI.
- Treat ChatGPT DOM/API shape as untrusted and version-fragile.
- Destructive operations fail closed when compatibility cannot be proven.
- Undocumented/private ChatGPT web endpoints may be investigated and used only when necessary to satisfy the product contract; isolate them behind an adapter, document the dependency, never persist/exfiltrate ChatGPT session secrets, and provide compatibility failure behavior.
- Do not auto-delete a ChatGPT conversation after saving it to the Vault.

## Decision rule

Routine implementation is `REVIEW_MODE: SELF`.

Move to `DECISION_NEEDED / OWNER: USER` instead of guessing if implementation would materially change:
- the UI surfaces above;
- snapshot semantics;
- V1 content scope;
- permission/privacy behavior;
- destructive-action confirmation semantics;
- cloud provider/auth model;
- use of a substantially broader ChatGPT data-access mechanism.

## Completion

Follow `docs/EXECUTION_PLAN.md`. Each phase must have GitHub evidence, required QA, and a separate SELF-review pass before DONE.