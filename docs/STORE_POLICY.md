# Chrome Web Store Policy Gate

This repository defaults to store-safe engineering even when an extension begins as a personal unpacked extension.

## Release gate

Before publishing or sharing a packaged extension, verify all items below.

### Single purpose

The extension has one clear, narrow, easy-to-explain purpose. New unrelated capabilities belong in another extension.

### Permissions

- Every permission is mapped to a user-visible feature.
- Host patterns are as narrow as practical.
- Optional permissions are used when access is only needed after a user enables a feature.
- No obsolete permissions remain.

### Remote code

All executable logic is packaged with the extension. No remotely hosted executable JavaScript/WASM or dynamic code-loading mechanism is present.

### Data use

Document:
- what data is accessed;
- whether it is stored;
- whether it leaves the device;
- retention/deletion behavior;
- why the data is necessary for the extension's purpose.

If external transmission exists, confirm the privacy disclosure accurately matches real behavior.

### User expectations

The extension must not:
- hide material behavior;
- imitate system/browser warnings deceptively;
- perform destructive or external side effects without user intent;
- change unrelated browser/site settings;
- inject ads, tracking, or monetization unrelated to its stated purpose.

### Store assets

Before release, verify:
- extension name and description match actual behavior;
- screenshots are current;
- permission explanations are accurate;
- privacy policy is present when required;
- version number is bumped;
- build output contains no dev/test artifacts.

## Permission review template

Each app must maintain `docs/PERMISSIONS.md` using this table:

```markdown
| Permission / host | Feature requiring it | Why narrower access is insufficient | Optional? |
|---|---|---|---|
| activeTab | ... | ... | no |
```

A permission without a documented row is considered a release blocker.

## Policy drift

Chrome Web Store policies and Manifest V3 behavior can change. Before an actual store submission or major permission increase, re-check the current official Chrome extension and Web Store policy documentation rather than relying only on this repository snapshot.
