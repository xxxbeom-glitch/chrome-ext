# Cursor Workflow

This repository is intentionally configured for Cursor Agent as well as human development.

## Instruction sources

Cursor supports both root `AGENTS.md` and scoped Project Rules under `.cursor/rules/*.mdc`.

Use them together:

1. `AGENTS.md` is the readable repository-wide policy and architecture contract.
2. `.cursor/rules/00-core.mdc` is always applied.
3. Scoped rules apply automatically when editing matching app, design, integration, or test files.
4. App-specific product decisions remain in `apps/<slug>/docs/`.

Do not add a legacy `.cursorrules` file. Keep new Cursor instructions in focused `.mdc` files.

## Expected Cursor start sequence

For a new task, Cursor should:

1. read `AGENTS.md`;
2. identify the target `apps/<slug>`;
3. read that app's `SPEC.md`, `PERMISSIONS.md`, and `QA.md`;
4. inspect relevant existing implementation and tests;
5. state or infer the smallest coherent change boundary;
6. implement without touching unrelated apps;
7. run repository verification and relevant QA;
8. report changed files, checks performed, and any unresolved risk.

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
Read AGENTS.md and the matching .cursor/rules first.
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
