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
| — | No active task claimed | — | — | — | — |

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

## Next planned product work

1. Run `pnpm agent:check` once in the user's real Cursor/local clone after pulling latest `main`.
2. Create the first app under `apps/` for ChatGPT conversation management.
3. Create its GitHub Task Issue and write SPEC / PERMISSIONS / QA before privileged implementation.

## Blockers / decisions needed

- No repository-side blocker.
- Local Cursor preflight (`pnpm agent:check`) still needs one real run on the user's development machine because GitHub Actions cannot validate the user's local `gh` authentication or local git state.
- Repository is public. Keep Issues/PRs public-safe; switch the repository to private before storing private operational context.
- GitHub server-side branch protection/ruleset is still optional hardening; repository rules currently enforce the workflow at agent/CI level, not at the server push-policy level.

## Recovery rule

Any agent resuming work must read in this order:

1. `CURRENT.md` and the full active-work table
2. the target GitHub Issue and its latest valid `STATE:` / `OWNER:` / `REVIEW_MODE:` headers, if an active task exists
3. `AGENTS.md` and matching `.cursor/rules/*.mdc`
4. relevant app `AGENTS.md` and `docs/SPEC.md`, `docs/PERMISSIONS.md`, `docs/QA.md`
5. relevant `docs/decisions/`
6. related PR / commit / CI evidence

Do not infer current state from old chat history when repository state is available.
