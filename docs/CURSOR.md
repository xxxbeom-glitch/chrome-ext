# Cursor Workflow

This repository is intentionally configured for Cursor Agent as well as human development.

## Instruction sources

Cursor supports root and nested `AGENTS.md` files plus scoped Project Rules under `.cursor/rules/*.mdc`.

Use them together:

1. root `AGENTS.md` is the readable repository-wide policy and architecture contract;
2. `apps/<slug>/AGENTS.md` adds app-local context and boundaries for that extension;
3. `.cursor/rules/00-core.mdc` is always applied;
4. scoped rules apply automatically when editing matching app, design, integration, or test files;
5. detailed product decisions remain in `apps/<slug>/docs/`.

Every app must have a nested `AGENTS.md`, created from `templates/APP_AGENTS.md` and filled with the app identity.

Do not add a legacy `.cursorrules` file. Keep new Cursor project instructions in focused `.mdc` files or the appropriate root/app `AGENTS.md`.

## Expected Cursor start sequence

For a new task, Cursor should:

1. read root `AGENTS.md`;
2. identify the target `apps/<slug>`;
3. read that app's nested `AGENTS.md`;
4. read that app's `SPEC.md`, `PERMISSIONS.md`, and `QA.md`;
5. inspect relevant existing implementation and tests;
6. state or infer the smallest coherent change boundary;
7. implement without touching unrelated apps;
8. run repository verification and relevant QA;
9. report changed files, checks performed, and any unresolved risk.

## Rule layout

```text
.cursor/
└─ rules/
   ├─ 00-core.mdc
   ├─ 10-extension-architecture.mdc
   ├─ 20-design-system.mdc
   ├─ 30-third-party-integrations.mdc
   └─ 40-testing-and-qa.mdc
```

Keep rules focused. Do not copy the full contents of `AGENTS.md` into every rule.

## Ignore files

`.cursorignore` blocks Cursor code-context access to secrets, credentials, private/session data, generated output, and packaged artifacts.

`.cursorindexingignore` removes noisy generated material from semantic indexing while leaving it accessible when explicitly needed.

Important: terminal commands and external MCP tools may operate outside `.cursorignore` protections. The policy remains: never intentionally read or expose secrets just because a tool technically can.

## Prompting Cursor for implementation

Good task prompt:

```text
Read root AGENTS.md, the app AGENTS.md, and matching .cursor/rules first.
Work only in apps/<slug> unless a shared change is required.
Read the app SPEC/PERMISSIONS/QA before implementation.
Implement <scope>.
Do not broaden permissions.
Use the shared design system.
Run pnpm qa and report any failing gate.
```

For third-party-site automation, also tell Cursor to verify the adapter compatibility contract and destructive-action failure behavior.

## Completion contract

Cursor must not claim a code task is complete without either:

- successful relevant QA; or
- an explicit statement of which check could not be executed and why.

A visual change also requires light/dark/system review, keyboard focus review, and host-page style-isolation review when injected into another website.
