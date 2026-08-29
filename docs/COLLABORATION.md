# GitHub Collaboration Contract

This repository uses GitHub as the shared operational hub between Cursor, ChatGPT, and the user.

ChatGPT is supported but is not a mandatory hop. The repository must remain fully operable in a Cursor-only workflow.

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

Do not have two agents simultaneously modify the same task scope.

Multiple active tasks are allowed only when their write scopes are disjoint.

Examples:
- `apps/chatgpt-cleaner/**` and `apps/another-extension/**` may run concurrently.
- Two tasks modifying the same app must not run concurrently unless their paths and behavioral contracts are explicitly proven independent.
- A task modifying `packages/**`, root configuration, repository policies, shared CI, or shared design-system behavior must declare that shared scope. Another task must not concurrently modify the same shared paths.
- If scope overlap is discovered after work starts, the later task moves to `BLOCKED` until ownership is resolved.

`CURRENT.md` lists every active task so agents can detect collisions before editing.

### Default responsibilities

**Cursor**
- implementation and implementation-level planning;
- tests, builds, debugging, and refactoring;
- GitHub Issue / branch / commit / PR work;
- routine evidence-based self-review;
- updating task state and `CURRENT.md` when operating without ChatGPT.

**ChatGPT**
- optional planning, product/UX/policy interpretation, adversarial review, and second-opinion review;
- creating or refining actionable task Issues when involved;
- durable decision analysis;
- review when `REVIEW_MODE: CHATGPT`.

**User**
- decisions that materially change product direction, privacy, payments, distribution, destructive behavior, or agreed UX;
- final hands-on product judgment when requested or when `REVIEW_MODE: USER`.

## 3. Task state machine

State is communicated in an Issue body or Issue comments using exact machine-readable headers:

```text
STATE: READY
OWNER: CURSOR
REVIEW_MODE: SELF
```

The canonical current state is the **latest valid `STATE:` + `OWNER:` pair in chronological order** across the Issue body and comments. `REVIEW_MODE` persists from the latest valid value unless explicitly changed.

If an Issue has no exact valid state header, treat it as `DRAFT` with no executable owner. GitHub Issue Form dropdown fields are descriptive metadata only; they do not replace exact headers.

Allowed states:

- `DRAFT` — incomplete scope; do not implement.
- `READY` — implementation-ready.
- `RUNNING` — current owner is actively working.
- `REVIEW` — implementation complete; review pass pending.
- `FIX_REQUIRED` — implementation needs another pass.
- `DECISION_NEEDED` — meaningful decision required from User or an explicitly chosen reviewer.
- `BLOCKED` — external dependency or scope collision prevents progress.
- `DONE` — Acceptance Criteria satisfied; Issue may be closed.

Allowed review modes:

- `SELF` — Cursor performs a separate review pass and may close the task itself.
- `CHATGPT` — Cursor hands evidence to ChatGPT for review.
- `USER` — user performs final acceptance/judgment.

`SELF` is the default for routine tasks within already approved scope and policy.

A state transition must always specify `OWNER:`. A task entering implementation must have a valid `REVIEW_MODE`.

## 4. Task Issue contract

A task Issue must contain:

1. App / scope
2. Goal
3. Context
4. Acceptance Criteria
5. Do Not Change
6. Relevant files / decisions
7. Required QA
8. Review mode
9. Initial exact `STATE` + `OWNER` + `REVIEW_MODE` header before execution

If these are not sufficient to implement safely, the Issue is not READY.

When using the browser Issue Form, Cursor or ChatGPT must add the first exact state comment before implementation begins.

## 5. Review-mode selection

Use `REVIEW_MODE: SELF` when all of the following are true:

- the task is explicit and objectively testable;
- implementation stays within existing SPEC and durable decisions;
- permissions, host permissions, privacy/data collection, and external transmission are unchanged;
- destructive-action semantics are unchanged;
- no unresolved product/UX/policy choice is being invented;
- shared architecture or repository policy is not being materially redefined.

Use `REVIEW_MODE: CHATGPT` when the user wants a second opinion, adversarial review, product/UX reasoning, policy interpretation, or a more independent reviewer.

Use `REVIEW_MODE: USER` when hands-on acceptance is inherently subjective or a user-level decision is the actual completion gate.

A high-impact task does **not** automatically require ChatGPT. Instead, unresolved material decisions must first move to `DECISION_NEEDED`. After the decision is explicitly recorded, implementation may continue with `SELF`, `CHATGPT`, or `USER` review as selected.

## 6. Cursor claim protocol

Before code changes, Cursor must:

1. read `CURRENT.md` and all listed active work;
2. read the target Issue and determine its latest valid state/review headers;
3. read repository and app-local rules;
4. ensure the Issue is `READY` with `OWNER: CURSOR`, or create a self-contained task Issue when the user has directly supplied a complete task;
5. run `pnpm agent:check` and ensure the current HEAD contains latest `origin/main`;
6. confirm its write scope does not overlap another RUNNING task;
7. ensure the working-tree state is understood;
8. comment on the Issue:

```text
STATE: RUNNING
OWNER: CURSOR
REVIEW_MODE: SELF|CHATGPT|USER
BRANCH: <branch>
BASE: main
SCOPE: <explicit write scope>
```

Cursor must not silently expand the task, write scope, or review mode.

## 7. Cursor implementation evidence

When implementation is complete, Cursor posts one Issue comment containing implementation evidence:

```text
STATE: REVIEW
OWNER: <CURSOR|CHATGPT|USER according to REVIEW_MODE>
REVIEW_MODE: <SELF|CHATGPT|USER>

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

## 8. Cursor SELF-review protocol

`SELF` means a second review pass, not immediate completion by the same implementation pass.

After posting implementation evidence, Cursor must re-read the task and review the resulting diff/evidence against:

1. every Acceptance Criterion;
2. declared write scope and Do Not Change boundaries;
3. SPEC / durable decision consistency;
4. permission, host-permission, privacy, and data-flow impact;
5. destructive-action safety where applicable;
6. tests, CI, build, E2E, and required manual smoke evidence;
7. error handling and partial-failure behavior;
8. residual risk and `NOT_DONE` accuracy;
9. unrelated changes or accidental scope expansion;
10. conflicts with other active work.

Cursor then posts exactly one of:

```text
STATE: DONE
OWNER: CURSOR
REVIEW_MODE: SELF
REVIEW: PASS
```

```text
STATE: FIX_REQUIRED
OWNER: CURSOR
REVIEW_MODE: SELF
REVIEW: <specific defect or missing evidence>
```

```text
STATE: DECISION_NEEDED
OWNER: USER
REVIEW_MODE: SELF
QUESTION: <material unresolved decision and consequences>
```

Cursor may close the Issue after `STATE: DONE` in SELF mode and must remove it from `CURRENT.md` promptly.

## 9. ChatGPT review protocol

For `REVIEW_MODE: CHATGPT`, Cursor posts implementation evidence with `STATE: REVIEW / OWNER: CHATGPT`.

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
REVIEW_MODE: CHATGPT
REVIEW: PASS
```

```text
STATE: FIX_REQUIRED
OWNER: CURSOR
REVIEW_MODE: CHATGPT
REVIEW: <specific required fix>
```

```text
STATE: DECISION_NEEDED
OWNER: USER
REVIEW_MODE: CHATGPT
QUESTION: <decision and consequences>
```

## 10. USER review protocol

For `REVIEW_MODE: USER`, Cursor posts implementation evidence with `STATE: REVIEW / OWNER: USER` plus concise manual verification instructions.

The user may accept, request changes, or ask Cursor/ChatGPT for analysis. Cursor must not infer acceptance from silence.

## 11. Fix loop limit

A task may cycle `FIX_REQUIRED -> RUNNING -> REVIEW` twice under the same unresolved defect class.

If the same task fails a third review because of a deeper assumption or unclear requirement, stop and move to `DECISION_NEEDED` or `BLOCKED` instead of infinite patching.

## 12. CURRENT.md discipline

`CURRENT.md` is intentionally short.

It contains only:
- active work table: Issue, app/scope, state, owner, review mode, branch;
- current baseline;
- immediate next work;
- blockers / decisions needed.

It must not become a changelog or implementation diary.

The active agent maintaining the task may update `CURRENT.md` on `main` when required by the workflow. Cursor must not mix unrelated implementation changes into a `CURRENT.md` bookkeeping commit.

An Issue in `DONE` or closed state must be removed from the active work table promptly.

## 13. Durable decisions

A decision gets a file under `docs/decisions/` only when reversing it later would materially affect:

- architecture;
- permissions/privacy;
- data behavior;
- destructive actions;
- extension distribution/store policy;
- shared design-system behavior;
- collaboration workflow.

Use `DEC-XXXX-short-title.md` and include status, date, context, decision, consequences, and superseded/amended decisions.

## 14. Direct Cursor operation

The user may work for an arbitrary sequence of tasks directly in Cursor without involving ChatGPT.

Cursor may plan, create the Task Issue, implement, self-review, close the Issue, update `CURRENT.md`, and proceed to the next task when:

- the work remains within explicit product/engineering policy;
- no material unresolved decision is guessed;
- required QA and evidence are recorded;
- write-scope collision rules are respected.

If product meaning or a high-impact policy choice is ambiguous, Cursor creates a decision/handoff Issue and moves the ambiguous scope to `DECISION_NEEDED` rather than inventing a choice.

ChatGPT can be introduced at any point by changing `REVIEW_MODE` or ownership in a valid state transition; the workflow does not need to be restarted.

## 15. Public repository warning

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
