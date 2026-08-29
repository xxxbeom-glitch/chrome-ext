# GitHub Collaboration Contract

This repository uses GitHub as the shared operational hub between ChatGPT, Cursor, and the user.

## 1. Sources of truth

Each artifact has one job. Do not duplicate the same state across several systems.

| Concern | Source of truth |
| --- | --- |
| Current repository state / active work | `CURRENT.md` |
| Product and engineering rules | `AGENTS.md`, `.cursor/rules/*.mdc` |
| App requirements | `apps/<slug>/docs/SPEC.md` |
| App permissions | `apps/<slug>/docs/PERMISSIONS.md` |
| App QA contract | `apps/<slug>/docs/QA.md` |
| Durable product/architecture decisions | `docs/decisions/` |
| Task discussion / questions / handoff | GitHub Issue |
| Implementation diff | Pull request / commit |
| Automated verification | GitHub Actions CI |

Chat history, terminal scrollback, and local editor state are never sources of truth.

## 2. Ownership and concurrency rule

A task has exactly one current owner.

Allowed owners:
- `CHATGPT`
- `CURSOR`
- `USER`

Do not have ChatGPT and Cursor simultaneously modify the same task scope.

Multiple active tasks are allowed only when their write scopes are disjoint.

Examples:
- `apps/chatgpt-cleaner/**` and `apps/another-extension/**` may run concurrently.
- Two tasks modifying the same app must not run concurrently unless their paths and behavioral contracts are explicitly proven independent.
- A task modifying `packages/**`, root configuration, repository policies, shared CI, or shared design-system behavior must declare that shared scope. Another task must not concurrently modify the same shared paths.
- If scope overlap is discovered after work starts, the later task moves to `BLOCKED` until ownership is resolved.

`CURRENT.md` lists every active task so both agents can detect collisions before editing.

### Default responsibilities

**ChatGPT**
- planning and scoping;
- product / UX / policy interpretation;
- creating actionable task Issues;
- review against Acceptance Criteria;
- durable decisions;
- updating `CURRENT.md` after state changes.

**Cursor**
- implementation;
- tests and build fixes;
- branch / commit / PR work;
- implementation-level investigation;
- reporting evidence and residual risk in the task Issue.

**User**
- decisions that materially change product direction, privacy, payments, distribution, destructive behavior, or agreed UX;
- final hands-on product judgment when requested.

## 3. Task state machine

State is communicated in an Issue body or Issue comments using an exact machine-readable header:

```text
STATE: READY
OWNER: CURSOR
```

The canonical current state is the **latest valid `STATE:` + `OWNER:` pair in chronological order** across the Issue body and comments.

If an Issue has no exact valid state header, treat it as `DRAFT` with no executable owner. GitHub Issue Form dropdown fields are descriptive metadata only; they do not replace the exact state header.

Allowed states:

- `DRAFT` — incomplete scope; do not implement.
- `READY` — implementation-ready.
- `RUNNING` — current owner is actively working.
- `REVIEW` — implementation complete; waiting for review.
- `FIX_REQUIRED` — same task returns to Cursor.
- `DECISION_NEEDED` — meaningful decision required from User/ChatGPT.
- `BLOCKED` — external dependency or scope collision prevents progress.
- `DONE` — Acceptance Criteria satisfied; Issue may be closed.

A state transition must always specify `OWNER:`.

## 4. Task Issue contract

A task Issue must contain:

1. App / scope
2. Goal
3. Context
4. Acceptance Criteria
5. Do Not Change
6. Relevant files / decisions
7. Required QA
8. Initial exact `STATE` + `OWNER` header before execution

If these are not sufficient to implement safely, the Issue is not READY.

When using the browser Issue Form, ChatGPT or Cursor must add the first exact state comment before implementation begins.

## 5. Cursor claim protocol

Before code changes, Cursor must:

1. read `CURRENT.md` and all listed active work;
2. read the target Issue and determine its latest valid state header;
3. read repository and app-local rules;
4. ensure the Issue is `READY` with `OWNER: CURSOR`, or create a self-contained task Issue when the user has directly supplied a complete task;
5. run `pnpm agent:check` and ensure the current HEAD contains latest `origin/main`;
6. confirm its write scope does not overlap another RUNNING task;
7. ensure the working-tree state is understood;
8. comment on the Issue:

```text
STATE: RUNNING
OWNER: CURSOR
BRANCH: <branch>
BASE: main
SCOPE: <explicit write scope>
```

Cursor must not silently expand the task or its write scope.

## 6. Cursor completion / handoff protocol

When implementation is complete, Cursor posts one Issue comment in this format:

```text
STATE: REVIEW
OWNER: CHATGPT

COMMIT: <sha>
PR: <url or NONE>
BRANCH: <branch>

CHANGED:
- <file / behavior>

QA:
- pnpm verify:repo: PASS/FAIL
- pnpm typecheck: PASS/FAIL
- pnpm test: PASS/FAIL
- pnpm build: PASS/FAIL
- pnpm test:e2e: PASS/FAIL/NOT_APPLICABLE
- manual smoke: PASS/FAIL/NOT_RUN

RESULT:
<what now works>

RISK:
<known fragility / NONE>

NOT_DONE:
<any intentionally incomplete work / NONE>
```

A failing or unexecuted check must never be hidden.

## 7. ChatGPT review protocol

ChatGPT reviews:

1. Acceptance Criteria;
2. SPEC / Decision consistency;
3. diff and declared write-scope consistency;
4. tests and CI evidence;
5. permission / privacy impact;
6. destructive-action safety when applicable;
7. missing or concealed unfinished scope;
8. whether concurrent work could have invalidated the implementation.

Then ChatGPT posts exactly one of:

```text
STATE: DONE
OWNER: CHATGPT
REVIEW: PASS
```

```text
STATE: FIX_REQUIRED
OWNER: CURSOR
REVIEW: <specific required fix>
```

```text
STATE: DECISION_NEEDED
OWNER: USER
QUESTION: <decision and consequences>
```

Normal implementation defects do not go to the user; they go back to Cursor.

## 8. Fix loop limit

A task may cycle `FIX_REQUIRED -> RUNNING -> REVIEW` twice.

If the same task fails review a third time because of a deeper assumption or unclear requirement, stop and move to `DECISION_NEEDED` or `BLOCKED` instead of infinite patching.

## 9. CURRENT.md discipline

`CURRENT.md` is intentionally short.

It contains only:
- active work table: Issue, app/scope, state, owner, branch;
- current baseline;
- immediate next work;
- blockers / decisions needed.

It must not become a changelog or implementation diary.

ChatGPT normally maintains `CURRENT.md` on `main`. Cursor should not edit it in feature branches unless the task explicitly assigns that responsibility.

An Issue in `DONE` or closed state must be removed from the active work table promptly.

## 10. Durable decisions

A decision gets a file under `docs/decisions/` only when reversing it later would materially affect:

- architecture;
- permissions/privacy;
- data behavior;
- destructive actions;
- extension distribution/store policy;
- shared design-system behavior;
- collaboration workflow.

Use `DEC-XXXX-short-title.md` and include status, date, context, decision, consequences, and superseded decisions.

## 11. Direct Cursor start

The user may start a task directly in Cursor without ChatGPT first.

Cursor may proceed without waiting for ChatGPT when:
- the task is explicit and implementation-level;
- it does not change a durable product/architecture decision;
- permissions and data access are unchanged;
- Acceptance Criteria can be written objectively;
- its write scope does not overlap an active RUNNING task.

Cursor must create a GitHub task Issue first, add an exact `STATE: READY / OWNER: CURSOR` state header, then claim it using the standard protocol.

If product meaning is ambiguous, Cursor creates a handoff/decision Issue and stops the ambiguous part rather than guessing.

## 12. Public repository warning

This repository is currently public. Everything committed or posted to Issues/PRs may be public.

Never place:
- account/session data;
- private conversation contents;
- tokens or credentials;
- personal exports;
- private screenshots;
- unpublished sensitive business information

in the repository.

If the collaboration hub will contain private operational context, change repository visibility to private before storing that context.
