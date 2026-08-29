# ChatGPT Cleaner + Conversation Vault — Cursor Execution Plan

This document defines the autonomous implementation loop for Cursor.

Default review mode: `SELF`.

## 1. Start sequence

Before implementation, Cursor must:

1. sync the local clone with latest `main`;
2. read root `CURRENT.md`;
3. read root `AGENTS.md`, `docs/COLLABORATION.md`, and matching `.cursor/rules/*.mdc`;
4. read this app `AGENTS.md` and every file under `apps/chatgpt-cleaner/docs/`;
5. run `pnpm agent:check`;
6. inspect open Issues and other RUNNING scopes;
7. identify the first incomplete phase below;
8. create or reuse one GitHub Task Issue for that phase;
9. claim it using the repository state-header format.

Do not implement from stale repository state or an undocumented task.

## 2. Autonomous loop

For each phase:

```text
Recover state
→ create/reuse phase Issue
→ claim RUNNING / CURSOR / SELF
→ implement smallest coherent phase
→ add/update tests and docs
→ run required QA
→ post implementation evidence as REVIEW / CURSOR / SELF
→ perform a separate SELF-review pass
   ├─ defect: FIX_REQUIRED and repair
   ├─ material choice: DECISION_NEEDED and ask user
   ├─ external setup missing: BLOCKED with exact user steps
   └─ pass: DONE and close Issue
→ update CURRENT.md
→ continue to next phase
```

Cursor should continue to the next phase automatically after DONE unless a stop condition applies.

## 3. Stop conditions

Do not stop merely because ChatGPT is absent.

Stop and ask the user only when:
- a material product/UX/privacy/permission/destructive-action choice would change the approved docs;
- required external account/project setup is unavailable;
- the only apparent solution materially broadens access beyond `PERMISSIONS.md`;
- current ChatGPT compatibility cannot support a destructive feature safely;
- the same phase fails SELF review three times because the underlying assumption/spec is wrong;
- an irreversible real-user action would be required purely for testing and no disposable test target exists.

When blocked, record one precise GitHub handoff with the missing decision/action and how Cursor will verify it afterward.

## 4. Phase 0 — App bootstrap and harness

Goal: convert the placeholder app into a healthy WXT TypeScript package integrated with the monorepo.

Required:
- initialize/normalize WXT without deleting existing docs/AGENTS;
- TypeScript and app scripts;
- shared design-system dependency;
- background/content/popup/Vault entrypoint shells;
- unit/E2E harness and sanitized fixture folder;
- MV3 manifest with permissions matching `PERMISSIONS.md`;
- lockfile update;
- no real destructive or cloud mutation yet.

Acceptance:
- unpacked build loads;
- popup shell and Vault shell render;
- content script loads only on ChatGPT;
- repository QA passes.

## 5. Phase 1 — Popup hub and injected UI shell

Goal: implement product surfaces without dangerous host mutation.

Required:
- popup actions: Open ChatGPT, Clean up conversations, Bookmarked conversations;
- open/focus ChatGPT behavior;
- centered cleanup overlay in isolated Shadow DOM;
- list/search/selection/progress/error states with mock/read-only data;
- per-row Archive/Delete affordances visible but not yet mutating;
- Vault list/reader shell with mock data;
- light/dark/system, keyboard/focus, reduced-motion QA.

Acceptance:
- surfaces follow PRODUCT/SPEC;
- no side panel;
- no destructive host operation.

## 6. Phase 2 — ChatGPT read-only adapter and bookmark injection

Goal: establish reliable read-only host integration before mutations.

Required:
- compatibility probe;
- read-only conversation discovery;
- explicit pagination/completeness semantics;
- structured current-conversation snapshot parser;
- sanitized test fixtures;
- assistant action-row detection;
- idempotent bookmark control injection;
- local capture/preview only at this phase;
- SPA navigation/rerender handling;
- host-specific assumptions isolated under `lib/adapters/chatgpt/`.

Acceptance:
- known current ChatGPT UI passes compatibility/manual smoke;
- modal shows discovered conversations read-only;
- loaded vs end-confirmed states are distinct;
- parser returns structured V1 blocks and completeness;
- injected bookmark control does not duplicate.

## 7. Phase 3 — Archive/Delete mutation engine

Goal: implement safe single and bulk cleanup.

Required:
- separate Archive and Delete operations;
- compatibility gates;
- stable target-ID snapshot before execution;
- bounded queue;
- per-item progress/results;
- retry failed only;
- duplicate-command protection;
- confirmations exactly as PRODUCT defines;
- controlled manual tests only on disposable conversations.

Acceptance:
- Archive and Delete never substitute for each other;
- Delete cancellation performs zero mutation;
- compatibility failure performs zero destructive action;
- partial failures are visible and retryable.

## 8. Phase 4 — Local Vault domain and safe renderer

Goal: prove snapshot and bookmark semantics independently of cloud activation.

Required:
- typed snapshot schema/domain model;
- safe snapshot renderer;
- local development repository/adapter;
- one snapshot per source conversation;
- multiple bookmark anchors;
- duplicate-anchor prevention;
- partial-capture protection;
- Vault list/reader wired to local development data;
- source-link behavior and Vault-only deletion behavior.

Acceptance:
- snapshot is readable independently of ChatGPT DOM;
- same conversation updates one record;
- anchors work;
- partial snapshot cannot replace a complete snapshot;
- captured content is rendered safely.

## 9. Phase 5 — Supabase schema and sign-in integration

Goal: enable user-owned cross-device Vault data.

Always complete locally first:
- version-controlled database migration;
- Row Level Security policies;
- `.env.example` with non-secret configuration names only;
- typed cloud repository/client;
- sign-in/session abstraction;
- browser-extension auth callback flow;
- exact external setup guide;
- tests using mocks/stubs where real cloud is unavailable.

If the configured external project is available through current tooling, Cursor may apply and verify it. Otherwise mark only the real-cloud activation gate BLOCKED with exact user steps and continue any independent work.

Acceptance before activation:
- migration and policies exist;
- app compiles/tests against cloud abstraction;
- no private credential is committed.

Acceptance after activation:
- sign-in works;
- user-scoped CRUD works;
- second browser/profile restores Vault data;
- user isolation is verified.

## 10. Phase 6 — Bookmark to cloud Vault flow

Goal: make the preservation promise end-to-end.

Required:
- bookmark click captures the full V1 snapshot;
- complete snapshot updates cloud record;
- clicked response anchor persists;
- save progress/success/failure UI;
- previous complete snapshot protected from partial capture/network failure;
- Vault page reads cloud data;
- sign-out/cache cleanup;
- repeated save semantics tested.

Acceptance:
- success appears only after persistence confirmation;
- one current snapshot per source conversation;
- multiple anchors persist;
- original source deletion does not remove Vault data.

## 11. Phase 7 — Integration hardening and MVP QA

Goal: clear the full `QA.md` contract.

Required:
- current real ChatGPT compatibility smoke;
- service-worker restart behavior;
- SPA navigation;
- theme/accessibility/focus review;
- cleanup partial failure/retry review;
- snapshot safe-rendering review;
- permission/manifest audit;
- network-destination audit;
- second browser/profile cloud restore;
- production unpacked smoke;
- documentation reconciliation.

Acceptance:
- all QA release blockers cleared;
- residual fragility documented;
- final SELF review passes;
- `CURRENT.md` has no stale active phase;
- implementation epic is DONE.

## 12. Issue/branch granularity

Default: one Task Issue and one feature branch per phase.

Suggested branch names:
- `feat/chatgpt-cleaner-p0-bootstrap`
- `feat/chatgpt-cleaner-p1-ui-shell`
- `feat/chatgpt-cleaner-p2-read-adapter`
- `feat/chatgpt-cleaner-p3-cleanup-mutations`
- `feat/chatgpt-cleaner-p4-local-vault`
- `feat/chatgpt-cleaner-p5-cloud-auth`
- `feat/chatgpt-cleaner-p6-cloud-bookmark`
- `test/chatgpt-cleaner-p7-hardening`

Split a phase only when it is genuinely too large; keep scopes explicit and avoid conflicting concurrent shared-file work.

## 13. Evidence and review

Use `docs/COLLABORATION.md` on every phase.

The separate SELF review must check:
- acceptance criteria;
- diff vs declared scope;
- permissions/data impact;
- destructive safety where applicable;
- tests/build/E2E/manual-smoke evidence;
- residual risk;
- `NOT_DONE` accuracy.

Do not weaken the product contract to make a phase pass.