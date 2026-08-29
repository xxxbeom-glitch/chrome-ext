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
| #21 | repo / CI Playwright + Auth PKCE + env naming | RUNNING | CURSOR | SELF | `fix/ci-auth-pkce-env` |

Concurrent active tasks are allowed only when their declared write scopes are disjoint. See `docs/COLLABORATION.md`.

## Current repository baseline

- Phases 0–5 engineering on `main`.
- Remediation in progress: CI Playwright install, PKCE auth contract, `WXT_PUBLIC_*` env naming.

## Next planned product work

1. Land #21 with GitHub Actions GREEN.
2. Continue Phase 6 cloud bookmark wiring without waiting on interactive Google smoke.
3. Keep #15/#20 BLOCKED for real USER actions only.

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
