# Shared Design System

All extension-owned UI uses the shared foundation in `packages/design-system` unless an app SPEC documents a deliberate exception.

## Goals

- consistent UI across many independent extensions;
- first-class light, dark, and system themes;
- readable Korean/Latin typography with Pretendard Variable;
- minimal visual coupling to third-party host websites;
- semantic tokens that survive redesigns without app-wide search/replace;
- accessible interaction states by default.

## Token architecture

Tokens use three layers.

### 1. Reference tokens: `--ce-ref-*`

Raw design values such as neutral/brand palettes, type scale, spacing scale, radii, shadows, and motion durations.

Product UI should not normally consume these directly.

### 2. System tokens: `--ce-sys-*`

Theme-aware semantic roles such as:

- canvas/surface/elevated backgrounds;
- primary/secondary/muted/inverse text;
- default/strong/focus borders;
- primary/danger/success/warning/info actions and states;
- hover/pressed/selected/disabled states;
- focus ring, overlay, selection, and scrollbar.

Most product CSS should use these tokens.

### 3. Component tokens: `--ce-comp-*`

Stable component-level dimensions and role mappings such as button/input heights, padding, icon sizes, checkbox/switch sizes, card padding, and popup dimensions.

Component tokens may map to system or reference tokens but should not introduce app-specific names.

## Theme contract

Supported modes:

- `system` — follows `prefers-color-scheme`;
- `light` — forces light theme;
- `dark` — forces dark theme.

Theme state is represented by `data-ce-theme="system|light|dark"` on the extension root element. If the attribute is absent, system behavior is used.

`theme.ts` provides small DOM helpers. Product-specific persistence remains app-owned so the design package is not coupled to Chrome storage policy.

Every UI feature must be reviewed in both light and dark themes before release.

## Typography

Default family: Pretendard Variable.

The shared base stylesheet bundles Pretendard from the pinned npm package. Runtime CDN font loading is not allowed.

Fallback stack:

```css
"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont,
system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo",
"Noto Sans KR", "Malgun Gothic", sans-serif
```

Default text is 14px/20px. Use the shared type scale rather than arbitrary sizes.

Recommended product usage:

- 12px: caption/metadata only;
- 13px: dense secondary UI;
- 14px: default controls/body;
- 16px: emphasized body/section label;
- 18–24px: titles in extension-owned surfaces;
- 28px+: rare; use only when the surface genuinely needs display hierarchy.

Prefer weights 400, 500, 600, and 700. Avoid using weight alone as the only way to communicate status.

## Color and contrast

- Use semantic text/background pairs.
- Normal text should target WCAG AA contrast (4.5:1) where technically practical.
- Large text and non-text controls should target at least 3:1 where applicable.
- Never communicate success/error/selection using color alone.
- Do not use raw palette values in app code for status states.

## Spacing

The shared spacing scale is based primarily on 4px increments with small 1/2/6/10px utilities where browser-extension density benefits from them.

Prefer shared spacing tokens. Do not invent screen-specific values such as `--chat-cleaner-row-gap` unless the value is truly component-specific and belongs inside that app.

## Radius

The default UI uses restrained radii rather than pill-shaped controls everywhere.

- small controls: 6px;
- standard controls/cards: 8px;
- large surfaces: 12px;
- full radius: only for pills, avatars, circular icon buttons, switches, or explicitly round UI.

## Elevation

Use shared shadows only for real stacking relationships such as popovers, dropdowns, dialogs, and elevated cards. Borders are preferred over shadows for ordinary grouping.

## Interaction states

Interactive components must define, where applicable:

- default;
- hover;
- active/pressed;
- focus-visible;
- selected/checked;
- disabled;
- destructive/danger;
- loading/progress.

Keyboard focus must remain visible. Do not remove outlines without replacing them with the shared focus treatment.

## Motion

Use shared motion durations/easing. Respect `prefers-reduced-motion: reduce` and remove non-essential animation in that mode.

Motion should explain state change, not decorate routine interactions.

## Third-party page injection

Never allow shared extension styles to reset or restyle the host website.

Preferred structure:

```text
content script
  -> extension-owned host element
  -> ShadowRoot
  -> shared tokens/base styles inside the isolated root
  -> extension UI
```

If Shadow DOM cannot be used, all selectors must be strongly namespaced and the app SPEC must document why isolation is weaker.

## Import patterns

For extension-owned pages such as popup/options/sidepanel:

```css
@import "@chrome-ext/design-system/base.css";
```

For isolated injected UI, import the token/base styles only inside the ShadowRoot or the extension-owned isolated stylesheet; never attach the reset/base stylesheet to the third-party document root.

## Adding a token

Before adding a token, ask:

1. Is an existing semantic token already correct?
2. Is the new value reusable across multiple surfaces?
3. Can it be named by purpose instead of a specific screen?
4. Does it need both light and dark values?
5. Does adding it create a duplicate concept?

If a new theme-dependent role is added, both light and dark mappings are mandatory in the same change.
