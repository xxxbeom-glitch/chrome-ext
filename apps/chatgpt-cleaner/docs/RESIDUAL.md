# Phase 7 residual risks and USER blockers

Last updated: 2026-08-29

## Cleared in engineering (automated)

- Repository gates: `pnpm qa` and GitHub Actions `validate` on main after Phase 6.
- Partial-overwrite protection (local + cloud path unit tests).
- Fail-closed host Archive/Delete until #15 proves live mutators.
- PKCE-only Auth contract; no `signInWithIdToken` mix.
- Manifest permissions limited to `storage` + `identity` + chatgpt.com + project Supabase host.
- Vault renderer uses text nodes + http(s)-only href sanitization.

## Still BLOCKED on USER action

| Issue | Why blocked | How Cursor verifies after USER completes |
| --- | --- | --- |
| #15 | Need disposable ChatGPT chats + current UI notes (optional private-web approval) for live Archive/Delete binding | Mutation adapter turns green only after compatibility positively proven; then disposable Archive/Delete smoke |
| #20 | Google Web OAuth client + Supabase redirect allowlist for `https://<extension-id>.chromiumapp.org/` | Popup Sign in with Google → session `signed_in` → cloud bookmark → second profile restore |

## Residual fragility (accepted for MVP engineering close)

- ChatGPT DOM selectors can drift; discovery/capture fail closed rather than guess.
- Content script bookmark save has no offline retry queue; failed cloud saves surface Retry on the control.
- List fallback from cloud→local on cloud list errors is best-effort; unsigned local data is not a merge of cloud history.
- Real ChatGPT / second-profile / production unpacked smoke remain manual (#20 / #15).

## MVP epic (#6) status rule

Do **not** mark epic #6 DONE while #15 or #20 remain BLOCKED, or while any QA.md release blocker is still true without an explicit residual entry above.
