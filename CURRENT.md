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
| #15 | `apps/chatgpt-cleaner` / live Archive-Delete binding | BLOCKED | USER | USER | n/a |
| #20 | `apps/chatgpt-cleaner` / Google Auth provider setup | BLOCKED | USER | USER | n/a |

Concurrent active tasks are allowed only when their declared write scopes are disjoint. See `docs/COLLABORATION.md`.

## Current repository baseline

- Phases 0–7 engineering complete on `main` (Phase 7 via #25/#26).
- Auth: Supabase OAuth PKCE only. Env: `WXT_PUBLIC_SUPABASE_*`.
- Residual / USER blockers: `apps/chatgpt-cleaner/docs/RESIDUAL.md`.
- Epic #6 stays open until #15/#20 clear or user accepts residual.

## Next planned product work

1. USER: complete #20 Google Web OAuth + Supabase redirect allowlist, then Cursor verifies sign-in + cross-profile restore.
2. USER: complete #15 disposable ChatGPT Archive/Delete notes, then Cursor binds live mutators fail-open only when proven.
3. After both, close epic #6.

## Blockers / decisions needed

- **#15 BLOCKED (USER):** live ChatGPT Archive/Delete binding.
- **#20 BLOCKED (USER):** Google Web OAuth client + Supabase redirect allowlist per `docs/SUPABASE_SETUP.md` (PKCE contract).
- Repository is public; keep Issues/PRs public-safe.

## Recovery rule

1. `CURRENT.md` active-work table
2. target GitHub Issue state headers
3. `AGENTS.md` + matching `.cursor/rules/*.mdc`
4. app `AGENTS.md` + docs including `EXECUTION_PLAN.md`
5. `docs/decisions/`
6. related Issue/PR/CI evidence
