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

- Active Issue: #1 — Establish GitHub collaboration hub for ChatGPT ↔ Cursor.
- State: RUNNING
- Current owner: ChatGPT
- Next owner: ChatGPT until the collaboration contract is completed and verified.

## Current repository baseline

- Chrome Manifest V3.
- WXT + TypeScript + pnpm workspace.
- Vitest + Playwright QA baseline.
- Shared light/dark/system design tokens.
- Pretendard bundled locally through `@chrome-ext/design-system`.
- Cursor project rules and nested app `AGENTS.md` convention.

## Next planned product work

1. Finish and verify the GitHub collaboration workflow.
2. Create the first app under `apps/` for ChatGPT conversation management.
3. Write that app's SPEC / PERMISSIONS / QA before privileged implementation.

## Blockers / decisions needed

- None.

## Recovery rule

Any agent resuming work must read in this order:

1. `CURRENT.md`
2. active GitHub Issue referenced above
3. `AGENTS.md`
4. relevant app `AGENTS.md` and `docs/SPEC.md`, `docs/PERMISSIONS.md`, `docs/QA.md`
5. relevant `docs/decisions/`
6. related PR / CI evidence

Do not infer current state from old chat history when repository state is available.
