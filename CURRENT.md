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

Concurrent active tasks are allowed only when their declared write scopes are disjoint. See `docs/COLLABORATION.md`.

## Current repository baseline

- Chrome Manifest V3 / WXT / Vitest / Playwright / shared design-system.
- ChatGPT Cleaner Phases 0–2 DONE on `main` (bootstrap, UI shell, read-only adapter).
- Durable MVP decisions: `docs/decisions/DEC-0002-chatgpt-cleaner-mvp-contract.md`.

## Next planned product work

1. Phase 3 cleanup mutation engine with fail-closed compatibility gates.
2. Continue Phases 4–7 automatically unless a stop condition triggers.

## Blockers / decisions needed

- Live ChatGPT Archive/Delete selector validation still needs disposable-conversation smoke before claiming real-host mutation PASS.
- Supabase/Google setup may BLOCK Phase 5 activation only.
- Repository is public; keep Issues/PRs public-safe.

## Recovery rule

1. `CURRENT.md` active-work table
2. target GitHub Issue state headers
3. `AGENTS.md` + matching `.cursor/rules/*.mdc`
4. app `AGENTS.md` + docs including `EXECUTION_PLAN.md`
5. `docs/decisions/`
6. related Issue/PR/CI evidence
