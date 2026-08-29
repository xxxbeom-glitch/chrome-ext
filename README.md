# chrome-ext

Personal Chrome extension monorepo.

This repository is the shared development workspace for multiple browser extensions. Each extension is isolated under `apps/`, while repository-wide engineering, security, QA, and release rules live at the root.

## Baseline

- Chrome-first, Manifest V3 only.
- WXT + TypeScript is the default extension toolchain.
- `pnpm` workspaces manage multiple extensions.
- Each extension must have one narrow, user-visible purpose.
- Permissions must be the minimum required for the implemented feature set.
- Remotely hosted executable code is prohibited.
- Service workers are treated as ephemeral; persistent state must live outside process memory.
- Unit tests + extension E2E + manual smoke QA are required before release.

## Repository layout

```text
chrome-ext/
├─ apps/
│  └─ <extension-slug>/
│     ├─ entrypoints/
│     ├─ lib/
│     ├─ assets/
│     ├─ public/
│     ├─ tests/
│     │  ├─ unit/
│     │  └─ e2e/
│     ├─ docs/
│     │  ├─ SPEC.md
│     │  ├─ PERMISSIONS.md
│     │  └─ QA.md
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ wxt.config.ts
├─ packages/
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ SECURITY.md
│  ├─ QA.md
│  ├─ STORE_POLICY.md
│  └─ DEVELOPMENT.md
├─ .github/workflows/ci.yml
├─ AGENTS.md
├─ pnpm-workspace.yaml
└─ package.json
```

## Creating an extension

1. Create `apps/<extension-slug>` with WXT + TypeScript.
2. Keep Chrome MV3 compatibility even if the tooling supports other browsers.
3. Write `docs/SPEC.md` and `docs/PERMISSIONS.md` before adding privileged APIs.
4. Implement the smallest end-to-end slice first.
5. Pass the repository QA gates before release.

Recommended bootstrap:

```bash
cd apps
pnpm dlx wxt@latest init <extension-slug>
```

Then adapt the generated project to this repository's rules instead of accepting broad permissions or unnecessary dependencies.

## Required checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

The root commands are the canonical CI interface. Individual apps may implement them internally.

## Read before coding

- [`AGENTS.md`](./AGENTS.md)
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- [`docs/SECURITY.md`](./docs/SECURITY.md)
- [`docs/QA.md`](./docs/QA.md)
- [`docs/STORE_POLICY.md`](./docs/STORE_POLICY.md)
- [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md)
