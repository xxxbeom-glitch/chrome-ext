# Cursor Workflow

This repository is intentionally configured for Cursor Agent as well as human development. GitHub is the operational hub shared with ChatGPT.

## Instruction and state sources

Cursor supports root and nested `AGENTS.md` files plus scoped Project Rules under `.cursor/rules/*.mdc`.

Use them together:

1. `CURRENT.md` is the first recovery checkpoint and lists all active work;
2. the target GitHub Issue contains the executable task / handoff conversation and exact state transitions;
3. root `AGENTS.md` is the repository-wide policy and architecture contract;
4. `apps/<slug>/AGENTS.md` adds app-local context and boundaries;
5. `.cursor/rules/00-core.mdc` and `.cursor/rules/05-github-collaboration.mdc` always apply;
6. other scoped rules apply when editing matching app, design, integration, or test files;
7. detailed product decisions remain in app docs and `docs/decisions/`.

Every app must have a nested `AGENTS.md`, created from `templates/APP_AGENTS.md` and filled with the app identity.

Do not add a legacy `.cursorrules` file.

## Expected Cursor start sequence

For a GitHub-backed task, Cursor must:

1. read `CURRENT.md` and inspect every active-work row for scope collisions;
2. read `docs/COLLABORATION.md`;
3. run `pnpm agent:check` when GitHub task state will be changed;
4. read the target GitHub Issue and determine the latest exact valid `STATE:` / `OWNER:` pair;
5. if no exact valid state header exists, treat the Issue as DRAFT and do not implement;
6. read root `AGENTS.md` and matching `.cursor/rules/*.mdc`;
7. identify the target `apps/<slug>` or explicit shared/root scope;
8. read app `AGENTS.md`, `SPEC.md`, `PERMISSIONS.md`, and `QA.md` when an app is involved;
9. inspect the implementation/tests and working-tree state;
10. ensure the target write scope is disjoint from other RUNNING tasks;
11. claim the Issue using the standard `STATE: RUNNING / OWNER: CURSOR` comment;
12. implement the smallest coherent change without touching unrelated apps;
13. run repository verification and relevant QA;
14. hand off in the Issue using the mandatory REVIEW evidence format.

`pnpm agent:check` fetches `origin/main` and fails if current HEAD does not contain the latest main baseline. Do not claim a task from a stale base.

If the user starts a complete implementation-level task directly in Cursor, Cursor creates a task Issue with an exact state header before implementation and follows the same sequence. Product/UX/policy ambiguity must become a decision/handoff Issue rather than an implicit guess.

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

## Prompting Cursor for implementation

Minimal prompt:

```text
Open this repo and continue from CURRENT.md.
Choose/read the GitHub Issue assigned to CURSOR, inspect other active scopes for collisions, and follow AGENTS.md, docs/COLLABORATION.md, and matching Cursor/app rules.
Do not broaden scope or permissions.
Run the required QA and hand the result back in the Issue using the repository handoff format.
```

The prompt should not need to repeat product policy that is already in GitHub.

For third-party-site automation, also verify adapter compatibility and destructive-action failure behavior.

## Completion contract

Cursor must not claim a code task is complete without:

- an Issue in `STATE: REVIEW` with `OWNER: CHATGPT` (unless explicit delegated review authority exists);
- commit/PR evidence;
- successful relevant QA or an explicit failing/not-run result;
- residual risk and intentionally unfinished work stated explicitly.

A visual change also requires light/dark/system review, keyboard focus review, and host-page style-isolation review when injected into another website.
