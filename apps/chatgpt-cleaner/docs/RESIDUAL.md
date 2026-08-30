# Cleanup-only residual risks and USER blockers

Last updated: 2026-08-30

## Current scope

- Conversation list discovery
- Archive
- Delete

Vault, bookmarks, Google login, Supabase sync and media backup are intentionally out of scope.

## Engineering safeguards

- Archive/Delete private-web calls are isolated in one adapter.
- Access token is memory-only.
- Destructive PATCH requests are not automatically retried.
- Archive and Delete use separate request bodies and must never fall through into each other.
- Delete confirmation remains owned by the extension cleanup UI.
- Popup no longer exposes bookmark/Vault/auth actions.
- Manifest no longer needs `identity` or Supabase host permission.

## Still requires USER live smoke

| Issue | Why | Required evidence |
| --- | --- | --- |
| #15 | Real signed-in ChatGPT destructive behavior cannot be safely proven with automated tests | Archive one disposable conversation and Delete a different disposable conversation after explicit confirmation |

## Residual fragility

- `/api/auth/session`, `/backend-api/conversations`, and `/backend-api/conversation/{id}` are private ChatGPT web contracts and may change.
- If they drift, the extension must show failure rather than guessing a replacement mutation.
- Real user data must never be used as an automated destructive test target.

## MVP epic (#6) status rule

Do not mark the cleanup-only MVP DONE until:
- automated repository gates are green;
- one disposable Archive smoke passes;
- one separate disposable Delete smoke passes;
- no Vault/bookmark/login UI is present in the shipping build.
