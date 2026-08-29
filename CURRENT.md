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

| Issue | App / scope | State | Owner | Branch |
| --- | --- | --- | --- | --- |
| #1 | repo / collaboration foundation | RUNNING | CHATGPT | main |

Concurrent active tasks are allowed only when their declared write scopes are disjoint. See `docs/COLLABORATION.md`.

## Current repository baseline

- Chrome Manifest V3.
- WXT + TypeScript + pnpm workspace.
- Vitest + Playwright QA baseline.
- Shared light/dark/system design tokens.
- Pretendard bundled locally through `@chrome-ext/design-system`.
- Cursor project rules and nested app `AGENTS.md` convention.
- GitHub Issues/PRs/CI collaboration contract with explicit task ownership.

## Next planned product work

1. Finish and verify the GitHub collaboration workflow.
2. Create the first app under `apps/` for ChatGPT conversation management.
3. Write that app's SPEC / PERMISSIONS / QA before privileged implementation.

## Blockers / decisions needed

- Local Cursor preflight (`pnpm agent:check`) still needs one real run on the user's development machine after pulling the latest main, because GitHub Actions cannot validate the user's local `gh` authentication.

## Recovery rule

Any agent resuming work must read in this order:

1. `CURRENT.md` and the full active-work table
2. the target active GitHub Issue and its latest valid `STATE:` / `OWNER:` header
3. `AGENTS.md` and matching `.cursor/rules/*.mdc`
4. relevant app `AGENTS.md` and `docs/SPEC.md`, `docs/PERMISSIONS.md`, `docs/QA.md`
5. relevant `docs/decisions/`
6. related PR / commit / CI evidence

Do not infer current state from old chat history when repository state is available.
