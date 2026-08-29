# Cursor Workflow

This repository is intentionally configured so the user can work either:

1. entirely in Cursor; or
2. with Cursor + ChatGPT through the same GitHub state model.

GitHub is the operational hub in both cases. ChatGPT is an optional reviewer/planning agent, not a mandatory hop.

## Instruction and state sources

Use these sources together:

1. `CURRENT.md` — first recovery checkpoint and all active work;
2. target GitHub Issue — executable task, exact state, review mode, and handoff evidence;
3. root `AGENTS.md` — repository-wide policy and architecture contract;
4. `apps/<slug>/AGENTS.md` — app-local boundaries;
5. `.cursor/rules/00-core.mdc` and `.cursor/rules/05-github-collaboration.mdc` — always applied;
6. other scoped Cursor rules — matching architecture/design/integration/test work;
7. app docs and `docs/decisions/` — durable product/engineering truth.

Every app must have a nested `AGENTS.md`, created from `templates/APP_AGENTS.md`.

Do not add a legacy `.cursorrules` file.

## Cursor-only start sequence

For a new task started directly in Cursor:

1. read `CURRENT.md` and inspect all active scopes;
2. read `docs/COLLABORATION.md`;
3. run `pnpm agent:check`;
4. read repository/app rules and relevant SPEC / PERMISSIONS / QA / decisions;
5. convert the user's request into a self-contained GitHub Task Issue;
6. choose a `REVIEW_MODE` (`SELF` is the routine default);
7. add exact headers:

```text
STATE: READY
OWNER: CURSOR
REVIEW_MODE: SELF
```

8. confirm the write scope is disjoint from other RUNNING tasks;
9. claim the Issue with `STATE: RUNNING` and explicit branch/base/scope;
10. implement the smallest coherent change;
11. run required QA;
12. post implementation evidence as `STATE: REVIEW`;
13. perform the review required by the selected review mode;
14. if SELF passes, post DONE, close the Issue, and update `CURRENT.md`;
15. continue to the next task without requiring ChatGPT.

`pnpm agent:check` fetches `origin/main` and fails if current HEAD does not contain the latest main baseline. Do not claim a task from a stale base.

## Review modes

### SELF — default routine path

Use for objectively testable work that stays within established product/engineering rules.

The implementation pass and review pass must be logically separate. After implementation evidence is posted, Cursor re-reads the Issue and checks the final diff/evidence against Acceptance Criteria, scope, protected behavior, SPEC/decisions, permissions/data behavior, destructive-action safety, QA, residual risk, and NOT_DONE.

Cursor may mark DONE itself only after this second pass succeeds.

### CHATGPT — optional second opinion

Use when the user explicitly wants ChatGPT review or when product/UX/policy/adversarial reasoning would benefit from a separate reviewer.

Cursor hands the Issue to `OWNER: CHATGPT` in REVIEW state. Existing GitHub history is sufficient; no chat-history copy/paste should be required.

### USER — hands-on acceptance

Use when subjective product judgment, visual feel, or manual acceptance by the user is the actual completion gate.

Cursor must provide concise verification instructions and must not infer acceptance from silence.

## Decision escalation

Cursor-only does not mean Cursor may invent important policy.

Move to `DECISION_NEEDED` before continuing ambiguous scope when implementation would materially redefine any of the following without an existing decision:

- product meaning or core UX policy;
- permissions / host permissions;
- privacy, data collection, or external transmission;
- destructive-action semantics;
- payment/auth/distribution/store-policy behavior;
- shared architecture or repository-wide operating policy.

After the decision is explicitly recorded, Cursor can resume and still use SELF review unless another mode is requested.

## Expected sequence for an existing GitHub-backed task

1. read `CURRENT.md` and inspect active-work collisions;
2. read `docs/COLLABORATION.md`;
3. run `pnpm agent:check` if GitHub task state will change;
4. read the target Issue and latest exact `STATE` / `OWNER` / `REVIEW_MODE`;
5. read root/app rules and docs;
6. inspect implementation/tests and working-tree state;
7. claim the Issue if READY/CURSOR;
8. implement without unrelated scope expansion;
9. run required QA;
10. post evidence and execute the declared review mode.

## Rule layout

```text
.cursor/
└─ rules/
   ├─ 00-core.mdc
   ├─ 05-github-collaboration.mdc
   ├─ 10-extension-architecture.mdc
   ├─ 20-design-system.mdc
   ├─ 30-third-party-integrations.mdc
   └─ 40-testing-and-qa.mdc
```

Keep rules focused. Do not copy the full contents of `AGENTS.md` into every rule.

## GitHub access

`gh` CLI is the required default bridge for Cursor terminal-based task state. Setup is documented in `docs/GITHUB_AGENT_SETUP.md`.

The official GitHub MCP Server may also be configured globally in Cursor, but it is optional and must not put a PAT or other secret into this repository.

A GitHub access failure is a workflow blocker for claiming, completing, or handing off tasks. Do not replace GitHub state with local scratch notes.

## Ignore files

`.cursorignore` blocks Cursor code-context access to secrets, credentials, private/session data, generated output, and packaged artifacts.

`.cursorindexingignore` removes noisy generated material from semantic indexing while leaving it accessible when explicitly needed.

Terminal commands and external MCP tools may operate outside `.cursorignore` protections. Never intentionally read or expose secrets just because a tool technically can.

## Minimal prompts

Cursor-only continuation:

```text
Open this repo and continue from CURRENT.md.
Use the GitHub workflow in docs/COLLABORATION.md.
If there is no active task, turn my request into a Task Issue and use REVIEW_MODE: SELF unless the task requires a decision or I ask for another reviewer.
Follow AGENTS.md and matching Cursor/app rules, run the required QA, self-review in a separate pass, then update GitHub state and CURRENT.md.
```

ChatGPT-reviewed task:

```text
Open this repo and continue from CURRENT.md.
Use REVIEW_MODE: CHATGPT for this task.
Implement and QA it, then hand the Issue to ChatGPT with the required evidence.
```

The prompt should not need to repeat product policy already stored in GitHub.

## Completion contract

Cursor must not claim a code task complete without:

- a GitHub Task Issue;
- commit/PR evidence as applicable;
- successful relevant QA or explicit failing/not-run evidence;
- residual risk and intentionally unfinished work stated explicitly;
- the review required by `REVIEW_MODE`;
- DONE/closed state and `CURRENT.md` cleanup when Cursor owns SELF completion.

A visual change also requires light/dark/system review, keyboard focus review, and host-page style-isolation review when injected into another website.
