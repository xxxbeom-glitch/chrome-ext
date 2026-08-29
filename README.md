# chrome-ext

Personal Chrome extension monorepo for building and maintaining multiple independent Chrome extensions.

Each extension is isolated under `apps/`. Repository-wide engineering, security, Cursor, QA, release, and visual-system rules live at the root.

## Baseline

- Chrome-first, Manifest V3 only.
- WXT + TypeScript is the default extension toolchain.
- `pnpm` workspaces manage multiple extensions.
- Cursor is supported through root/nested `AGENTS.md` plus scoped `.cursor/rules/*.mdc` project rules.
- Each extension must have one narrow, user-visible purpose.
- Permissions must be the minimum required for the implemented feature set.
- Remotely hosted executable code is prohibited.
- Service workers are treated as ephemeral; persistent state must live outside process memory.
- All extension-owned UI uses the shared light/dark/system design system by default.
- Pretendard Variable is the default typeface and is bundled locally from npm.
- Unit tests + extension E2E + manual smoke QA are required before release.

## Repository layout

```text
chrome-ext/
├─ apps/
│  └─ <extension-slug>/
│     ├─ AGENTS.md
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
│  └─ design-system/
│     ├─ src/
│     │  ├─ tokens.css
│     │  ├─ base.css
│     │  └─ theme.ts
│     ├─ package.json
│     └─ tsconfig.json
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ SECURITY.md
│  ├─ QA.md
│  ├─ STORE_POLICY.md
│  ├─ DEVELOPMENT.md
│  ├─ DESIGN_SYSTEM.md
│  └─ CURSOR.md
├─ templates/
│  ├─ APP_AGENTS.md
│  ├─ SPEC.md
│  ├─ PERMISSIONS.md
│  └─ QA.md
├─ scripts/
│  └─ verify-repo.mjs
├─ .cursor/
│  └─ rules/
│     ├─ 00-core.mdc
│     ├─ 10-extension-architecture.mdc
│     ├─ 20-design-system.mdc
│     ├─ 30-third-party-integrations.mdc
│     └─ 40-testing-and-qa.mdc
├─ .cursorignore
├─ .cursorindexingignore
├─ .github/workflows/ci.yml
├─ AGENTS.md
├─ pnpm-workspace.yaml
└─ package.json
```

## Creating an extension

1. Create `apps/<extension-slug>` with WXT + TypeScript.
2. Copy `templates/APP_AGENTS.md` to `apps/<extension-slug>/AGENTS.md` and fill in the app identity.
3. Copy and complete `SPEC.md`, `PERMISSIONS.md`, and `QA.md` from `templates/`.
4. Keep Chrome MV3 compatibility even if the tooling supports other browsers.
5. Add `@chrome-ext/design-system` as a `workspace:*` dependency for extension-owned UI.
6. Implement the smallest end-to-end slice first.
7. Pass the repository QA gates before release.

Recommended bootstrap:

```bash
cd apps
pnpm dlx wxt@latest init <extension-slug>
```

Then adapt the generated project to this repository's rules instead of accepting broad permissions or unnecessary dependencies.

## Shared UI

For popup/options/sidepanel and other extension-owned pages:

```css
@import "@chrome-ext/design-system/base.css";
```

Use `--ce-sys-*` semantic tokens and `--ce-comp-*` component tokens in app code. Raw `--ce-ref-*` primitives belong primarily inside the design-system mapping.

Themes support `system`, `light`, and `dark` through `data-ce-theme`.

See [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md).

## Cursor

Cursor reads the root `AGENTS.md`, nested app `AGENTS.md`, and scoped rules under `.cursor/rules/`. The repository also includes `.cursorignore` and `.cursorindexingignore` to reduce secret exposure and indexing noise.

Start Cursor tasks by reading the target app docs and the matching project rules. Do not use a legacy `.cursorrules` file.

See [`docs/CURSOR.md`](./docs/CURSOR.md).

## Required checks

```bash
pnpm verify:repo
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Run the full gate with:

```bash
pnpm qa
```

The root commands are the canonical CI interface. Individual apps may implement them internally.

## Read before coding

- [`AGENTS.md`](./AGENTS.md)
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- [`docs/SECURITY.md`](./docs/SECURITY.md)
- [`docs/QA.md`](./docs/QA.md)
- [`docs/STORE_POLICY.md`](./docs/STORE_POLICY.md)
- [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md)
- [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md)
- [`docs/CURSOR.md`](./docs/CURSOR.md)
