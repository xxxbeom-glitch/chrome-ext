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

Concurrent active tasks are allowed only when their declared write scopes are disjoint. See `docs/COLLABORATION.md`.

## Current repository baseline

- Phases 0–3 engineering on `main`: WXT bootstrap, UI shell, read-only adapter, fail-closed cleanup engine.
- Live ChatGPT Archive/Delete host binding is intentionally unbound (fail-closed).

## Next planned product work

1. Continue Phase 4 local Vault domain while #15 remains BLOCKED.
2. Phases 5–7 afterward; interrupt only for additional stop conditions.

## Blockers / decisions needed

- **#15 BLOCKED (USER):** live ChatGPT Archive/Delete binding needs disposable-conversation smoke and/or approval to investigate private-web mutation endpoints. Recommendation recorded on the Issue (defer live mutation; continue Vault phases).
- Supabase/Google setup may BLOCK Phase 5 activation only.
- Repository is public; keep Issues/PRs public-safe.

## Recovery rule

1. `CURRENT.md` active-work table
2. target GitHub Issue state headers
3. `AGENTS.md` + matching `.cursor/rules/*.mdc`
4. app `AGENTS.md` + docs including `EXECUTION_PLAN.md`
5. `docs/decisions/`
6. related Issue/PR/CI evidence
