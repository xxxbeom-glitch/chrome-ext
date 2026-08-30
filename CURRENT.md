# CURRENT

Last updated: 2026-08-30

## Repository state

- Repository role: multi-extension Chrome extension workspace.
- Operational hub: GitHub.
- Product/code rules: `AGENTS.md` + `.cursor/rules/*.mdc`.
- Implementation evidence: commits / pull requests / CI.
- Task and handoff conversation: GitHub Issues.
- Durable decisions: `docs/decisions/`.

## Active work

| Issue | App / scope | State | Owner | Review mode | Branch |
| --- | --- | --- | --- | --- | --- |
| #6 | `apps/chatgpt-cleaner` / cleanup-only MVP epic | READY | CURSOR | SELF | parent epic |
| #15 | `apps/chatgpt-cleaner` / live Archive-Delete smoke | BLOCKED | USER | USER | `main` (PR #38 merged) |

Concurrent active tasks are allowed only when their declared write scopes are disjoint. See `docs/COLLABORATION.md`.

## Current repository baseline

- Current product scope is **conversation-list cleanup only**.
- The extension lists the signed-in user's ChatGPT conversations and lets the user select items for **보관** or **삭제**.
- Cleanup-only implementation is merged to `main` via PR #38.
- Message-level bookmarks, whole-conversation Vault snapshots, generated-media backup, Google login and Supabase cloud sync are not part of the current MVP.
- Popup exposes only `대화방 정리하기`, `ChatGPT 열기`, and theme selection.
- Auth/Vault shipping entrypoints are removed.
- Manifest uses `storage` plus `https://chatgpt.com/*`; `identity` and Supabase host permission are removed.
- Cleanup discovery uses same-origin ChatGPT account-history pagination; sidebar scraping remains fallback-only.
- Live Archive/Delete is isolated behind the ChatGPT private-web mutation adapter.
- Delete requires explicit confirmation. Failed destructive requests are never automatically retried, and Archive never falls through to Delete.
- PR #38 CI passed repository policy, lint, typecheck, unit tests, production build, and extension E2E.

## Next planned product work

1. USER: sync local clone with latest `main`, rebuild, and reload the unpacked extension.
2. USER: verify the conversation list loads normally.
3. USER: use one intentionally disposable conversation for Archive smoke.
4. USER: use a separate intentionally disposable conversation for Delete smoke with explicit confirmation.

## Blockers / decisions needed

- **#15 BLOCKED (USER):** engineering and automated QA are complete; only real signed-in Archive/Delete smoke on disposable conversations remains.
- Private ChatGPT web endpoints may drift; failures must remain visible and must never fall through from Archive to Delete.
- Repository is public; never commit private chats, screenshots, tokens, cookies, exports, or secrets.
- Vault/message-saving work (#20, #32, #36) is intentionally closed/not planned unless the USER explicitly reintroduces it later.

## Recovery rule

1. `CURRENT.md` active-work table
2. target GitHub Issue state headers
3. `AGENTS.md` + matching `.cursor/rules/*.mdc`
4. app `AGENTS.md` + docs including `EXECUTION_PLAN.md`
5. `docs/decisions/`
6. related Issue/PR/CI evidence
