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

- Chrome Manifest V3.
- WXT + TypeScript + pnpm workspace.
- Vitest + Playwright QA baseline.
- Shared light/dark/system design tokens.
- Pretendard bundled locally through `@chrome-ext/design-system`.
- Cursor project rules and nested app `AGENTS.md` convention.
- GitHub Issues/PRs/CI collaboration contract with explicit task ownership and disjoint-scope concurrency rules.
- Cursor-only execution is supported through `REVIEW_MODE: SELF` with a mandatory separate second-pass review.
- Optional `REVIEW_MODE: CHATGPT` and `REVIEW_MODE: USER` remain available without changing the underlying workflow.
- Unresolved material product/policy/privacy/permission/destructive-action decisions move to `DECISION_NEEDED` instead of being guessed.
- Collaboration foundation Issues #1 and #4 are DONE and closed.
- ChatGPT Cleaner product definition Issue #5 is DONE and closed.
- ChatGPT Cleaner Phase 0 bootstrap Issue #7 is DONE and closed; WXT shells/harness are on `main`.
- ChatGPT Cleaner MVP product/technical/data/permission/QA/execution contracts live under `apps/chatgpt-cleaner/`.
- Durable MVP decisions are recorded in `docs/decisions/DEC-0002-chatgpt-cleaner-mvp-contract.md`.

## Next planned product work

1. Cursor creates/claims Phase 1 UI shell task and continues Phase 1–7 automatically under Issue #6.
2. User is interrupted only for an explicit `DECISION_NEEDED` or external setup `BLOCKED` condition defined by the execution plan.

## Blockers / decisions needed

- No repository-side blocker for Phase 1.
- Supabase/Google external project activation may require a later one-time user setup during Phase 5 if Cursor cannot configure it through available tooling. This does not block Phases 0–4.
- Repository is public. Keep Issues/PRs public-safe; switch the repository to private before storing private operational context.
- GitHub server-side branch protection/ruleset remains optional hardening; agent/CI rules currently enforce the workflow but do not themselves prevent a direct server push to `main`.

## Recovery rule

Any agent resuming work must read in this order:

1. `CURRENT.md` and the full active-work table
2. the target GitHub Issue and its latest valid `STATE:` / `OWNER:` / `REVIEW_MODE:` headers
3. `AGENTS.md` and matching `.cursor/rules/*.mdc`
4. relevant app `AGENTS.md` and all app docs, including `EXECUTION_PLAN.md`
5. relevant `docs/decisions/`
6. related phase Issue / PR / commit / CI evidence

Do not infer current state from old chat history when repository state is available.
