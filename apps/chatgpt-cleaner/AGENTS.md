# ChatGPT Cleaner AGENTS.md

This file supplements the repository root `AGENTS.md`. Root security, permission, QA, design-system, and GitHub collaboration rules remain mandatory.

## Product identity

- App slug: `chatgpt-cleaner`
- Working product name: ChatGPT 대화 정리
- Single purpose: load the user's ChatGPT conversation list and let the user Archive or Delete selected conversations.
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

- Current MVP is **cleanup-only**.
- Conversation cleanup appears as a centered injected overlay/modal inside ChatGPT. Do not replace it with a Chrome side panel.
- The cleanup list supports checkbox selection, per-row Archive/Delete, bulk Archive/Delete, progress, and itemized failures.
- Archive does not require irreversible confirmation. Delete does.
- Delete confirmation must identify the target or exact bulk target count.
- Archive and Delete are separate operations. Never fall through from one to the other.
- Destructive PATCH requests are never automatically retried.
- The popup is a lightweight launcher for `대화방 정리하기`, `ChatGPT 열기`, and theme only.

## Explicitly out of scope until a new USER decision

Do not expose, implement, or re-enable any of the following as routine work:

- message-level bookmark/save controls
- whole-conversation snapshot capture
- Conversation Vault / saved conversation page
- Supabase cloud sync
- Google login/auth UI
- generated/uploaded media backup
- storing ChatGPT message/conversation bodies in an extension-owned backend

Legacy prototype files/migrations may remain for historical rollback, but they are not current runtime/product requirements.

## Architecture boundaries

- Put ChatGPT-specific discovery/private-web assumptions/mutations under `lib/adapters/chatgpt/`.
- Keep content/background entrypoints thin.
- Use Shadow DOM or equivalent strong isolation for the cleanup UI.
- Use `@chrome-ext/design-system` and Pretendard for extension-owned UI.
- Treat ChatGPT private-web contracts as untrusted and version-fragile.
- ChatGPT session/access tokens are memory-only: never persist, log, commit, or transmit them to Supabase/third parties.
- Unknown endpoint/schema behavior must fail visibly rather than guess.

## Permission boundary

Current shipping manifest should require only:
- `storage`
- `https://chatgpt.com/*`

Do not add `identity`, Supabase host permissions, broad host permissions, cookies, or other permissions without a new explicit USER decision and matching docs update.

## Decision rule

Routine implementation is `REVIEW_MODE: SELF`.

Move to `DECISION_NEEDED / OWNER: USER` instead of guessing if implementation would materially change:
- cleanup UI surface
- Archive/Delete semantics
- destructive confirmation behavior
- ChatGPT data-access mechanism
- permissions/privacy behavior
- or reintroduce any Vault/bookmark/cloud feature.

## Completion

Follow `docs/QA.md`. Automated gates must be green, and real destructive behavior requires USER smoke with intentionally disposable conversations before DONE.
