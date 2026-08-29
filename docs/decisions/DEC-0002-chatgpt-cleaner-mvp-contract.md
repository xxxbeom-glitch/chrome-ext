# DEC-0002 — ChatGPT Cleaner + Conversation Vault MVP contract

Status: Accepted
Date: 2026-08-29

## Context

The first real extension in this monorepo needs both fast ChatGPT conversation cleanup and an independent way to preserve important conversations before the original is archived or deleted.

## Decision

For MVP:

- Product has two connected capabilities: Cleaner and Conversation Vault.
- Chrome action popup is a lightweight hub.
- Cleanup uses a centered injected modal inside ChatGPT, not a Chrome side panel.
- Cleanup supports per-row and bulk Archive/Delete.
- Archive requires no irreversible confirmation; Delete requires explicit confirmation and bulk target count.
- Assistant-response action rows receive an extension-owned bookmark/save action.
- Bookmarking persists a structured snapshot of the whole current conversation plus an anchor to the clicked response.
- One extension user + one source ChatGPT conversation maps to one current Vault snapshot; later valid saves update it and preserve/add anchors.
- A partial capture must never overwrite a known-complete snapshot.
- V1 snapshot content includes text/Markdown semantics, code, tables, and links; media/file binaries are deferred.
- Supabase is the default cloud backend and Google OAuth is the default sign-in approach.
- Vault data is independent of the original ChatGPT conversation; deleting either side does not implicitly delete the other.
- Host-specific integration is isolated behind compatibility adapters and destructive actions fail closed on incompatibility.
- Cursor may execute implementation phase-by-phase in `REVIEW_MODE: SELF` under `apps/chatgpt-cleaner/docs/EXECUTION_PLAN.md`.

## Consequences

- The app requires persistent host access to `chatgpt.com` and a configured Supabase project host.
- Snapshot fidelity is semantic, not pixel-perfect.
- Media archival, snapshot version history, AI organization, and automatic account-wide backup are intentionally deferred.
- ChatGPT host changes are an expected maintenance risk; compatibility checks and fixtures are part of the product, not optional QA.
- Cloud activation may require a one-time user setup step even though Cursor can implement the rest autonomously.

## Supersedes

None.