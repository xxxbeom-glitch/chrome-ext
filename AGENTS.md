# AGENTS.md

This file defines mandatory repository-wide instructions for human and AI contributors, including Cursor Agent.

## 1. Repository purpose

This is a multi-extension monorepo. Do not optimize the repository around one extension. New apps must remain isolated under `apps/<slug>` and must not couple unrelated products.

## 2. Default stack

- Chrome Manifest V3 only.
- TypeScript by default.
- WXT is the default extension framework unless a specific extension has a documented reason not to use it.
- pnpm workspaces manage dependencies.
- Vitest is the default unit-test runner.
- Playwright is the default browser/E2E harness.
- Prefer platform APIs and small dependencies over heavy frameworks.

## 3. Architecture rules

- Keep entrypoints thin. Business logic belongs in `lib/` or approved shared packages.
- Treat background service workers as ephemeral. Never rely on global in-memory state surviving between events.
- Persist durable state in `chrome.storage` or another explicitly documented store.
- Content scripts are untrusted-page-adjacent code. Validate all data crossing page/extension boundaries.
- Do not expose privileged extension APIs directly to page scripts.
- Message schemas must be typed, narrow, and validated.
- Feature/domain packages may move to `packages/` only after real duplication exists across at least two extensions.
- Repository-mandated foundation packages, such as `packages/design-system`, are explicit exceptions because every extension is required to share them.

## 4. Permission discipline

Every permission is a liability.

Before adding a permission or host permission:
1. document the user-visible feature requiring it in the app's `docs/PERMISSIONS.md`;
2. prove a narrower permission cannot satisfy the feature;
3. prefer `activeTab` and `optional_permissions` / `optional_host_permissions` where practical;
4. keep match patterns as narrow as possible;
5. remove unused permissions immediately.

Never add `<all_urls>` by convenience.

## 5. Security and privacy

- No remotely hosted executable JavaScript or WebAssembly.
- No `eval`, `new Function`, string-to-code execution, or equivalent dynamic execution.
- Do not inject remote scripts into extension contexts.
- No secrets, tokens, private keys, cookies, session material, or user exports in Git.
- Never log sensitive page content, auth data, or personal data by default.
- Data collection must be strictly tied to the extension's stated single purpose.
- Prefer local-only processing. Any external transmission requires explicit documentation, user benefit, and privacy review.
- Treat DOM content from websites as untrusted input.
- Sanitize rendered HTML; prefer text nodes and safe templating.

## 6. Chrome Web Store constraints

Each extension must:
- have a clear single purpose;
- request only permissions required for that purpose;
- accurately disclose data behavior;
- avoid deceptive UI or hidden behavior;
- avoid downloading executable code at runtime;
- keep all executable logic reviewable in the submitted package.

Store-policy compliance is a release gate even for extensions initially used only locally, unless an app explicitly documents that it will never be distributed.

## 7. Implementation workflow

For each meaningful change:
1. identify the target app and its scope;
2. read the app SPEC, permissions document, and QA document;
3. inspect current architecture before changing it;
4. implement the smallest coherent slice;
5. add or update tests in the same change;
6. run repository verification, static checks, unit tests, build, and relevant E2E;
7. perform manual extension smoke QA when browser behavior changed;
8. update documentation when permissions, data flow, UX contract, design tokens, or architecture changed.

Do not silently broaden scope.

## 8. Definition of done

A change is not done until:
- `pnpm verify:repo` passes;
- lint passes;
- TypeScript passes with no ignored errors added;
- unit tests pass;
- production build succeeds;
- relevant E2E tests pass;
- permissions are unchanged or documented;
- no remote executable code was introduced;
- manual smoke steps are complete when extension runtime behavior changed;
- documentation reflects the implemented behavior.

## 9. Testing expectations

Unit-test pure logic aggressively: parsing, filtering, storage adapters, message validation, permission decisions, state transitions, and theme utilities.

E2E-test extension-specific behavior: install/load, popup/options/side-panel UI, content-script injection, message passing, storage persistence, permission prompts, theme behavior, and critical host-page integration.

When a third-party website DOM is involved, isolate selectors behind an adapter and test failure behavior. Never scatter selectors throughout business logic.

## 10. Third-party site integrations

For extensions augmenting sites such as ChatGPT, Gmail, YouTube, etc.:
- isolate site-specific selectors/API assumptions in `lib/adapters/<site>/`;
- add compatibility checks;
- fail closed rather than performing destructive actions when selectors or expected responses no longer match;
- destructive bulk operations require preview/count + explicit confirmation + per-item failure reporting;
- undocumented/private web APIs must be flagged in the app SPEC as fragile and reviewed before use.

## 11. Destructive actions

Delete, bulk edit, send, purchase, submit, archive, or irreversible operations require stronger controls:
- explicit user initiation;
- clear target count/scope;
- confirmation for irreversible operations;
- bounded concurrency;
- rate-limit handling where relevant;
- partial-failure reporting;
- no hidden retries that can duplicate side effects.

## 12. Dependency policy

Before adding a runtime dependency, ask whether the platform or a small local helper can replace it. Avoid dependencies that:
- execute install scripts without a strong reason;
- pull remote code at runtime;
- are abandoned or have unclear ownership;
- duplicate Web APIs already available.

Lock dependencies and review unexpected lockfile expansion.

Pretendard is an approved shared UI dependency and must be bundled from the pinned npm package through `packages/design-system`; do not load it from a CDN in extension runtime code.

## 13. Change boundaries

Do not refactor unrelated extensions while implementing one app.
Do not move feature/domain code into `packages/` speculatively.
Do not change repository-wide tooling for an app-local preference without a demonstrated cross-repo benefit.
Repository foundation packages explicitly mandated here may be shared from day one.

## 14. Design system

All extension-owned UI must use the shared design foundation in `packages/design-system` unless the app SPEC documents a justified exception.

Rules:
- Pretendard Variable is the default typeface.
- Support light, dark, and system theme behavior from the first UI implementation.
- Use the token hierarchy `ref` (primitive) -> `sys` (semantic) -> `comp` (component).
- Application UI should consume `sys` and `comp` tokens. Do not bind product code directly to primitive color tokens unless defining or extending the design system itself.
- Do not hard-code colors, shadows, radii, spacing, typography values, focus rings, or motion values when an appropriate shared token exists.
- New shared visual values must be added to the design system first and named by role rather than by screen or feature.
- Use semantic status colors for success, warning, danger, and info. Do not use raw red/green/blue values in product UI.
- Preserve visible keyboard focus and WCAG AA contrast for normal text wherever technically practical.
- Respect `prefers-reduced-motion`.
- Injected host-page UI should use Shadow DOM or equivalent strong style isolation; do not import the global base stylesheet directly into a third-party page root.

Read `docs/DESIGN_SYSTEM.md` before implementing UI.

## 15. Cursor compatibility

Cursor officially supports root and nested `AGENTS.md` files. This root file remains the human-readable source of non-negotiable repository policy.

Cursor-specific scoped rules live in `.cursor/rules/*.mdc` and are version-controlled.

When using Cursor:
- read and obey this `AGENTS.md` plus every matching `.cursor/rules/*.mdc` rule;
- do not create or rely on a legacy `.cursorrules` file;
- keep Cursor rules focused and scoped instead of duplicating this entire document into every rule;
- do not weaken `.cursorignore` to make an agent task easier;
- treat terminal/MCP access as potentially outside `.cursorignore` protection and never intentionally read secrets;
- inspect the target app's docs before editing implementation files;
- run `pnpm qa` before declaring implementation complete unless the task is documentation-only and the relevant checks are explicitly unnecessary.

Read `docs/CURSOR.md` for the expected Cursor workflow.

## 16. Documentation hierarchy

Repository rules in this file override app-local convenience. App-specific decisions belong under `apps/<slug>/docs/`. If an app intentionally deviates from a repository default, document the reason and trade-off in its SPEC.
