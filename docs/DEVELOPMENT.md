# Development Workflow

## Principles

This repository is optimized for repeated extension development, not one-off prototypes.

## New app checklist

Create `apps/<slug>/` and add:

- WXT + TypeScript project files
- `docs/SPEC.md`
- `docs/PERMISSIONS.md`
- `docs/QA.md`
- unit test folder
- E2E folder
- only the entrypoints actually required

## App SPEC minimum

Every app SPEC must state:

- problem / single purpose;
- target host(s);
- primary user flow;
- privileged operations;
- data accessed/stored/transmitted;
- destructive operations;
- fragile dependencies such as third-party DOM/private APIs;
- explicit out-of-scope items;
- acceptance criteria.

## Branch/change discipline

Keep changes scoped to one extension unless the change is truly repository-wide.

Preferred commit categories:
- `feat:` user-visible capability
- `fix:` defect correction
- `test:` test-only change
- `docs:` documentation
- `refactor:` behavior-preserving code change
- `chore:` tooling/repository maintenance

## Dependency rule

Install app-specific dependencies in that app. Install at the root only when the dependency is truly repository-wide tooling.

## Generated output

Do not commit normal build output unless a specific release workflow requires it. Keep source, test fixtures, docs, and configuration as the source of truth.

## Private/undocumented APIs

Using undocumented site APIs is not forbidden by repository mechanics, but it is a fragility and policy risk. Before use:

1. document why public/DOM-supported alternatives are insufficient;
2. isolate calls in a host adapter;
3. implement compatibility/error handling;
4. never assume the API is stable;
5. re-check target service terms/policies before distribution.

## Versioning

Each extension versions independently. A change to one app does not require version bumps for unrelated apps.

Use semantic intent:
- patch: fixes/internal safe improvements;
- minor: backward-compatible capability;
- major: meaningful behavioral/permission/data-contract change.

## Release preparation

Before packaging:

1. check official Chrome extension/Web Store documentation for policy-sensitive changes;
2. run all QA gates;
3. review effective manifest permissions;
4. verify all code is packaged locally;
5. verify privacy disclosures against actual data flow;
6. run manual smoke on the production build;
7. bump only the target app version;
8. package the target app, not the monorepo.
