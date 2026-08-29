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

- Phases 0–5 engineering on `main` (bootstrap → UI → read adapter → fail-closed cleanup engine → local Vault → Supabase schema/auth scaffolding).
- Supabase project `chatgpt-cleaner` has Vault tables + RLS applied.
- Live ChatGPT Archive/Delete host binding remains unbound.
- Interactive Google sign-in awaits Auth provider/redirect setup.

## Next planned product work

1. Cursor can continue Phase 6 cloud bookmark code against typed boundaries + local fallback.
2. User resolves #15 and/or #20 when ready for live mutation / sign-in smoke.
3. Phase 7 hardening after cloud path is exercisable.

## Blockers / decisions needed

- **#15 BLOCKED (USER):** live ChatGPT Archive/Delete binding (disposable conversations / UI notes / private-web approval). Recommendation: defer while Vault work continues.
- **#20 BLOCKED (USER):** enable Google Auth on Supabase project + OAuth redirect for extension identity flow. Exact steps on the Issue.
- Repository is public; keep Issues/PRs public-safe.

## Recovery rule

1. `CURRENT.md` active-work table
2. target GitHub Issue state headers
3. `AGENTS.md` + matching `.cursor/rules/*.mdc`
4. app `AGENTS.md` + docs including `EXECUTION_PLAN.md`
5. `docs/decisions/`
6. related Issue/PR/CI evidence
