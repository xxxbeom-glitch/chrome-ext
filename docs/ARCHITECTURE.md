# Architecture Baseline

## Goals

The repository must support many independent Chrome extensions without turning into one coupled application.

## Monorepo boundaries

`apps/<slug>` is the product boundary. Each app owns its manifest configuration, entrypoints, tests, documentation, and release artifacts.

`packages/` is reserved for proven shared modules only. A module should not move there until at least two apps use substantially the same behavior.

## Default app shape

```text
apps/<slug>/
├─ entrypoints/
│  ├─ background.ts
│  ├─ content.ts
│  ├─ popup/
│  ├─ options/
│  └─ sidepanel/
├─ lib/
│  ├─ adapters/
│  ├─ domain/
│  ├─ messaging/
│  ├─ storage/
│  └─ ui/
├─ assets/
├─ public/
├─ tests/
│  ├─ unit/
│  └─ e2e/
└─ docs/
```

Only create entrypoints the extension actually needs.

## Runtime model

### Background service worker

Use for privileged Chrome APIs, event coordination, alarms, context menus, or state transitions that cannot live in a page context.

Assume the worker can stop at any time. Reconstruct state from persistent storage when activated.

### Content script

Use only for host-page observation or UI augmentation. Keep it thin. Website-specific DOM assumptions belong behind adapters.

### Extension pages

Popup, options, side panel, and other extension pages should communicate with privileged code through typed messages rather than reaching across layers ad hoc.

## Data flow

Preferred flow:

```text
User action
  -> UI/Content entrypoint
  -> validated typed command
  -> background/domain service
  -> Chrome API / storage / host adapter
  -> typed result
  -> UI state update
```

Avoid shared mutable global state.

## Messaging

Every message must have:
- a stable discriminant/type;
- a typed payload;
- runtime validation at trust boundaries;
- an explicit response/error shape.

Never accept generic `any` messages from page context.

## Third-party host adapters

All fragile assumptions about a target site should be localized:

```text
lib/adapters/chatgpt/
├─ selectors.ts
├─ parser.ts
├─ operations.ts
└─ compatibility.ts
```

When a host page changes, the adapter should fail safely and expose an actionable compatibility error.

## Storage

Use `chrome.storage.local` for durable extension-local state unless synchronization is an explicit product requirement. Use `chrome.storage.sync` sparingly due to quota and privacy implications.

Version persistent schemas and provide migrations once stored data becomes non-trivial.

## UI isolation

Injected UI must avoid colliding with host CSS. Prefer shadow DOM or strongly scoped styles for complex injected interfaces.

Do not depend on host typography, spacing tokens, or class names unless the product explicitly requires native visual integration.

## Build output

Source code lives under each app. Generated `.output/`, packaged ZIP/CRX artifacts, screenshots, and test traces are build artifacts and should not be treated as source of truth.
