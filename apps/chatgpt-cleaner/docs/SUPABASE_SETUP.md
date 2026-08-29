# Supabase / Google sign-in setup (Phase 5+)

Canonical Auth contract for this extension (do not mix flows):

**Supabase OAuth PKCE + `chrome.identity.launchWebAuthFlow` + `exchangeCodeForSession`.**

Do **not** use `signInWithIdToken` / Google Chrome Identity Token API for this app.

## Why this flow

`chrome.identity.launchWebAuthFlow` strips URL hashes. Supabase implicit flow puts tokens in the hash, so it breaks in extensions. PKCE returns `?code=` in the query string, which chrome.identity preserves.

## 1. Supabase project

1. Use the dedicated `chatgpt-cleaner` project (or create one).
2. Copy only the project URL + **anon/publishable** key into local `.env`.
3. Never put a service-role key in the extension, Issues, or git.
4. Apply `apps/chatgpt-cleaner/supabase/migrations/202608290001_vault_schema.sql` if not already applied.
5. Confirm RLS is enabled and policies require `auth.uid() = user_id`.

## 2. Google Cloud OAuth client (one type only)

Create a Google Cloud OAuth client of type:

**Web application**

Not "Chrome extension" and not "Desktop".

Authorized redirect URIs (Google Cloud → Credentials → OAuth client):

1. Supabase callback (required):
   `https://<project-ref>.supabase.co/auth/v1/callback`
2. Do **not** put the chromiumapp.org URL in Google Cloud for this PKCE path.
   Google redirects to Supabase first; Supabase then redirects to the extension.

Authorized JavaScript origins (if required by Google Console):
- `https://<project-ref>.supabase.co`

Copy the Google **Client ID** and **Client Secret** into Supabase → Authentication → Providers → Google.

## 3. Supabase Auth configuration

1. Authentication → Providers → Google: enable, paste Client ID + Client Secret.
2. Authentication → URL Configuration → Redirect URLs: add the extension redirect **after** you know the Extension ID:
   - `https://<extension-id>.chromiumapp.org/`
   - Also accept the exact value logged/copied from `chrome.identity.getRedirectURL()` (usually trailing slash).

### When is the Extension ID needed?

- **After** you load the unpacked production build once from `apps/chatgpt-cleaner/.output/chrome-mv3`.
- Chrome assigns a stable ID for that unpacked path (or the store ID after publish).
- Open the service worker / popup console and run conceptually: the app uses `browser.identity.getRedirectURL()`.
- Copy that exact URL into Supabase Redirect URLs.
- Optional: set `WXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL` to the same value; leaving it empty is preferred so the runtime identity API owns the value.

Until the Extension ID redirect is allowlisted, interactive Google sign-in smoke stays BLOCKED (#20). Schema/code/tests can proceed without it.

## 4. Extension env

```bash
cp apps/chatgpt-cleaner/.env.example apps/chatgpt-cleaner/.env
```

Fill:

```text
WXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
WXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
# optional override; prefer empty
WXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL=
```

Canonical naming is `WXT_PUBLIC_*` only. Do not use `VITE_SUPABASE_*`.

## 5. Permissions already declared

- `identity` — for `launchWebAuthFlow` / `getRedirectURL`
- `storage` — session persistence via chrome.storage.local adapter
- `https://<project-ref>.supabase.co/*` — Auth + Vault API

## 6. Verify after Google/Supabase dashboards are ready

1. Rebuild + load unpacked extension.
2. Popup → Sign in with Google.
3. Confirm session persists across service-worker restart.
4. Insert a Vault row as user A; confirm user B / anonymous cannot read it.
5. Second Chrome profile sign-in restores Vault list.

If Google provider/redirect is not ready, keep using the local Vault repository and leave #20 BLOCKED.
