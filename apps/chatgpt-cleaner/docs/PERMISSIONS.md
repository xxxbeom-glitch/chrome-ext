# ChatGPT Cleaner + Conversation Vault — Permissions Review

## Effective permission table

| Permission / host | User-visible feature | Why narrower access is insufficient | Optional? |
|---|---|---|---|
| `storage` | persist theme/settings, safe operation recovery metadata, client cache | extension state must survive popup/service-worker lifecycle | No |
| `identity` | Google OAuth redirect flow for Supabase Auth | browser-safe OAuth callback handling is required for cross-device Vault sign-in | No if chosen auth implementation uses `chrome.identity`; otherwise remove it |
| `https://chatgpt.com/*` | inject cleanup modal/bookmark action; discover/capture/mutate ChatGPT conversations | the product must operate continuously on ChatGPT, not only after one toolbar click | No |
| configured `https://<project-ref>.supabase.co/*` | save/read synced Vault snapshots | cloud sync requires cross-origin API access from extension context | No after cloud sync is enabled |

## Explicitly not requested by default

- `<all_urls>` — forbidden.
- `tabs` — do not request merely to open/focus a tab; add only if implementation proves a specific required API/property needs it.
- `scripting` — do not request if static WXT/content-script registration can satisfy injection.
- `webRequest` / `webRequestBlocking` — not part of the product contract.
- `cookies` — forbidden for convenience; ChatGPT cookies/session material must not be read or stored as a general extension capability.
- `history`, `downloads`, `clipboardRead`, `clipboardWrite` — no V1 requirement.

## ChatGPT host-access constraints

Host access exists only to deliver the explicit product features:
- cleanup list/discovery;
- Archive/Delete initiated by the user;
- injected bookmark action;
- current-conversation snapshot capture.

It must not be used for background surveillance, unrelated page scraping, advertising, or collection outside the stated product flow.

If an undocumented ChatGPT private-web endpoint is required, use the existing `chatgpt.com` host boundary when technically possible. Do not broaden host permissions merely to simplify reverse engineering.

## Supabase constraints

- only the configured project host may be allowlisted;
- never allowlist `*.supabase.co` unless a concrete technical requirement is proven and documented;
- no service-role key in the client;
- cloud writes require authenticated user context and RLS.

## Review questions for every permission change

- Can a narrower permission or host pattern satisfy the feature?
- Is the permission exercised by shipped code now?
- Does the change expose more ChatGPT/account data than the SPEC requires?
- Does the change create a new Chrome install warning?
- Is it reflected in `PRODUCT.md`, `SPEC.md`, and privacy/data behavior?
- Does it require `DECISION_NEEDED` under app `AGENTS.md`?

Any undocumented permission is a blocker. Cursor must not expand permissions during a routine SELF-reviewed implementation task without first updating this document and, when material, asking for user decision.