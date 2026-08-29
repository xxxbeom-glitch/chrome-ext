# @chrome-ext/design-system

Shared visual foundation for every extension in this repository.

## What it provides

- Pretendard Variable bundled from the pinned `pretendard` npm package;
- reference, semantic, and component CSS custom-property tokens;
- light/dark/system theme mappings;
- extension-owned-page base styles and focus treatment;
- reduced-motion behavior;
- small theme DOM helpers.

## App dependency

Add the workspace dependency in an extension:

```json
{
  "dependencies": {
    "@chrome-ext/design-system": "workspace:*"
  }
}
```

For popup/options/sidepanel and other extension-owned documents:

```css
@import "@chrome-ext/design-system/base.css";
```

For custom isolated styling, import only the tokens:

```css
@import "@chrome-ext/design-system/tokens.css";
```

Do not attach `base.css` directly to a third-party host document because it contains a small reset. Injected UI should normally live inside Shadow DOM.

## Theme

```ts
import { applyTheme, type ThemeMode } from "@chrome-ext/design-system/theme";

const mode: ThemeMode = "system";
applyTheme(mode);
```

Persist the preference in the app's own storage layer, then call `applyTheme` when the UI starts.

## Token usage

Prefer semantic/component roles:

```css
.panel {
  padding: var(--ce-sys-space-lg);
  border: var(--ce-sys-border-width-default) solid var(--ce-sys-color-border-subtle);
  border-radius: var(--ce-sys-radius-surface);
  background: var(--ce-sys-color-bg-surface);
  color: var(--ce-sys-color-text-primary);
}

.primaryButton {
  min-height: var(--ce-comp-button-height-md);
  padding-inline: var(--ce-comp-button-padding-inline-md);
  border-radius: var(--ce-comp-button-radius);
  background: var(--ce-sys-color-action-primary);
  color: var(--ce-sys-color-action-primary-text);
}
```

Do not consume `--ce-ref-color-*` directly in app UI unless you are extending the design-system mapping itself.

See `docs/DESIGN_SYSTEM.md` for repository-wide rules.
