# QA Harness

The goal is not infinite QA. The goal is a repeatable release gate that catches extension-specific failures before they reach the user's browser.

## Test pyramid

### 1. Static gates — every change

- formatting/lint
- TypeScript typecheck
- dependency/build validation
- Manifest V3 build success

### 2. Unit tests — every behavior change

Use Vitest for deterministic application logic such as:
- parsers and filters;
- selectors/adapters with fixture HTML;
- storage schema/migrations;
- message validation;
- batch-operation state machines;
- permission decision helpers;
- retry/backoff logic.

Avoid testing Chrome itself. Mock only the narrow browser API boundary.

### 3. Extension E2E — critical flows

Use Playwright with a persistent Chromium context and the built extension loaded unpacked.

Cover, as applicable:
- extension loads without manifest/service-worker errors;
- popup/options/side-panel opens;
- content script injects only on allowed hosts;
- extension UI survives navigation/SPA route changes;
- background/content/popup messaging works;
- storage persists across page reload and service-worker restart assumptions;
- optional permission request/denial behavior;
- destructive operations show scope and confirmation;
- partial batch failures are reported safely.

### 4. Manual smoke — release candidate

Chrome extension behavior still has browser/UI edges automation may miss. Before a release candidate:

1. `pnpm build`
2. load the production output via `chrome://extensions` in Developer Mode;
3. inspect manifest permissions shown by Chrome;
4. open service-worker DevTools and confirm no startup errors;
5. execute the extension's primary user journey;
6. reload/restart the browser and repeat persistence-sensitive steps;
7. test one expected failure/denial path;
8. inspect console/network for accidental sensitive logging or unexpected hosts.

Record app-specific smoke cases in `apps/<slug>/docs/QA.md`.

## Third-party host compatibility

For extensions that modify another site:
- maintain representative DOM fixtures for adapter unit tests;
- add a compatibility probe before destructive operations;
- test missing/renamed selector behavior;
- test SPA navigation where relevant;
- never silently fall back to a broad selector for destructive targeting.

## Destructive batch QA

Bulk operations must be tested for:
- zero selection;
- one item;
- multiple items;
- cancellation/abort where supported;
- one item failing mid-batch;
- rate-limit/retry condition;
- host compatibility failure;
- duplicate execution prevention;
- confirmation copy matching exact operation and count.

## Release blocker severity

### Blocker

- production build fails;
- extension does not load;
- requested permissions exceed documented needs;
- remote executable code exists;
- data leaves device without disclosure;
- destructive targeting can become ambiguous;
- critical user journey fails;
- security boundary regression.

### Important but follow-up capable

- non-critical UI edge case;
- telemetry-less diagnostic limitation;
- minor performance issue with safe behavior.

### Idea

- refactor without current defect;
- speculative shared abstraction;
- unsupported browser expansion.

Only Blockers prevent release by default.

## CI contract

The root CI interface is:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Every app must either implement these scripts or intentionally expose no-op/`--if-present` behavior at the workspace layer until the relevant test class exists. A shipped extension should not use a no-op for build, typecheck, or its critical E2E path.
