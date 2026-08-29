# Supabase / Google sign-in setup (Phase 5)

This guide is for one-time human setup. Cursor can implement code/migrations without credentials.

## 1. Create a dedicated Supabase project

1. Create a new project (do not reuse unrelated production DBs).
2. Copy the project URL and **anon/publishable** key only.
3. Never place a service-role key in the extension, Issues, or git.

## 2. Apply migration

Run `apps/chatgpt-cleaner/supabase/migrations/202608290001_vault_schema.sql` in the Supabase SQL editor (or via CLI linked to the project).

Confirm:
- `vault_conversations` and `bookmarks` exist;
- RLS is enabled on both;
- policies require `auth.uid() = user_id`.

## 3. Enable Google Auth

1. In Supabase Auth providers, enable Google.
2. Configure the Google OAuth client with the redirect URLs Supabase shows.
3. Add the extension callback URL once chrome.identity / unlisted auth page is finalized:
   - `https://<extension-id>.chromiumapp.org/`
   - and/or `chrome-extension://<extension-id>/auth.html` if used.

## 4. Configure the extension

1. Copy `apps/chatgpt-cleaner/.env.example` to `apps/chatgpt-cleaner/.env`.
2. Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Update `docs/PERMISSIONS.md` host allowlist with the exact `https://<project-ref>.supabase.co/*` pattern before requesting it in the manifest.
4. Rebuild the extension.

## 5. Verify

- Sign in from the popup.
- Create a Vault row as user A.
- Confirm user B / anonymous cannot read it.
- Sign in on a second Chrome profile and confirm Vault restore.

If credentials/project are unavailable, leave this gate BLOCKED and keep using the local Vault repository.
