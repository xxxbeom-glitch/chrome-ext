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
| #34 | `apps/chatgpt-cleaner` / bookmark action-row compatibility | RUNNING | CURSOR | SELF | `fix/chatgpt-cleaner-bookmark-action-row` |

Concurrent active tasks are allowed only when their declared write scopes are disjoint. See `docs/COLLABORATION.md`.

## Current repository baseline

- Phases 0–7 engineering complete on `main`.
- User-facing UI copy: Korean (no i18n framework).
- Cleanup overlay discovers account history via same-origin ChatGPT list API (#31/#33); sidebar scrape is fallback only.
- Auth: Supabase OAuth PKCE only. Env: `WXT_PUBLIC_SUPABASE_*`.
- Residual / USER blockers: `apps/chatgpt-cleaner/docs/RESIDUAL.md`.

## Next planned product work

1. USER: signed-in discovery smoke (sidebar collapsed + home).
2. USER: #20 Google OAuth setup; #15 live Archive/Delete.

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
