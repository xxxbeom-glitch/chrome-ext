# App AGENTS.md

This file defines app-local instructions for human and AI contributors. It supplements the repository root `AGENTS.md`; it does not override repository-wide security, permission, QA, or design-system requirements.

## Product identity

- App slug: `<extension-slug>`
- Single purpose: `<one sentence>`
- Target hosts: `<domains or extension-owned only>`

## Mandatory context

Before changing this app, read:

- `docs/SPEC.md`
- `docs/PERMISSIONS.md`
- `docs/QA.md`
- root `AGENTS.md`
- matching root `.cursor/rules/*.mdc`

## Boundaries

- Work only inside this app unless a shared repository change is genuinely required.
- Do not broaden the app's single purpose without updating `docs/SPEC.md` first.
- Do not add permissions or host permissions without updating `docs/PERMISSIONS.md` first.
- Keep host-specific selectors/API assumptions under `lib/adapters/<site>/`.
- Use `@chrome-ext/design-system` for extension-owned UI.
- Preserve light/dark/system theme support.
- Add/update tests with behavior changes.

## App-specific decisions

Record stable product/architecture decisions here only when they are too important to leave implicit. Detailed rationale belongs in `docs/SPEC.md`.

- None yet.

## Completion

Before declaring the app change complete:

1. run app-relevant tests;
2. run repository `pnpm qa` when feasible;
3. perform required manual extension smoke QA;
4. report any skipped gate explicitly.
