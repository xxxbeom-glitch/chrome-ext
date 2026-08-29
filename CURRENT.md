# CURRENT

Last updated: 2026-08-29

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
| #6 | `apps/chatgpt-cleaner` / MVP implementation epic | READY | CURSOR | SELF | parent epic |
| #15 | `apps/chatgpt-cleaner` / live Archive-Delete binding | RUNNING | CHATGPT | USER | `feat/message-vault-and-live-mutations` |
| #36 | `apps/chatgpt-cleaner` / independent message bookmarks | RUNNING | CHATGPT | SELF | `feat/message-vault-and-live-mutations` |
| #20 | `apps/chatgpt-cleaner` / Google Auth live verification | BLOCKED | USER | USER | n/a |
| #32 | `apps/chatgpt-cleaner` / V1.1 generated media backup | BLOCKED | CURSOR | SELF | future |

Concurrent active tasks are allowed only when their declared write scopes are disjoint. See `docs/COLLABORATION.md`.

## Current repository baseline

- Account history discovery uses same-origin ChatGPT private-web pagination (#31/#33); sidebar scraping is fallback only.
- User confirmed real signed-in discovery returns 170 conversations.
- Bookmark action-row compatibility uses current turn-copy clusters (#34/#35).
- Product contract is being changed from whole-conversation Vault snapshots to independent saved question/answer items (#36).
- Live Archive/Delete private-web binding is being implemented under #15; destructive real-account smoke remains USER-only.
- Auth remains Supabase OAuth PKCE only. Env: `WXT_PUBLIC_SUPABASE_*`.

## Next verification

1. Automated: typecheck/unit/build/E2E/CI for #15 + #36.
2. Supabase: apply `vault_items` migration with RLS; legacy Vault tables remain for rollback.
3. USER: rebuild/reload extension and verify one assistant answer and one user question save independently.
4. USER: use disposable ChatGPT conversations to smoke one Archive and one Delete.
5. USER: finish/verify Google OAuth + second-profile cloud restore gate (#20).

## Safety / blockers

- **#15:** implementation may proceed, but actual Delete verification must use an intentionally disposable conversation and explicit user confirmation.
- **#20:** real OAuth/session/second-profile restore still requires USER environment.
- Repository is public; keep Issues/PRs public-safe and never commit private chat data, screenshots, tokens, cookies, exports, or secrets.

## Recovery rule

1. `CURRENT.md` active-work table
2. target GitHub Issue state headers
3. `AGENTS.md` + matching `.cursor/rules/*.mdc`
4. app `AGENTS.md` + docs including `EXECUTION_PLAN.md`
5. `docs/decisions/`
6. related Issue/PR/CI evidence
