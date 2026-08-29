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
| #23 | `apps/chatgpt-cleaner` / Phase 6 cloud bookmark wiring | RUNNING | CURSOR | SELF | `feat/chatgpt-cleaner-p6-cloud-bookmark` |

Concurrent active tasks are allowed only when their declared write scopes are disjoint. See `docs/COLLABORATION.md`.

## Current repository baseline

- Phases 0–5 engineering on `main`.
- Remediation #21/#22 merged: CI Playwright Chromium install, PKCE auth contract, `WXT_PUBLIC_*` env naming. Main Actions GREEN (`33237285058`).

## Next planned product work

1. Finish #23 Phase 6 (cloud when signed in, local fallback; no interactive Google smoke required).
2. Continue Phase 7 hardening that does not need live ChatGPT or Google.
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
