# Residual risks and USER verification gates

Last updated: 2026-08-29

## Engineering status

- Real signed-in account history discovery has been user-smoked successfully (170 conversations loaded).
- Current bookmark action-row locator works for assistant responses on the user's live ChatGPT UI.
- Branch `feat/message-vault-and-live-mutations` changes the canonical Vault model to independent saved messages (`vault_items`).
- The same branch binds live ChatGPT Archive/Delete private-web PATCH requests.
- Legacy whole-conversation Vault tables/local storage remain untouched for rollback and are no longer the intended new write target.

## USER verification still required

| Issue | Required live evidence |
| --- | --- |
| #15 | One disposable conversation Archive + one separate disposable conversation Delete; verify actual ChatGPT source state after each action |
| #36 | One assistant answer saves alone; one user question saves alone when a safe user action row is present; verify adjacent turns are not copied |
| #20 | Google OAuth/session persistence + cloud save + second-profile restore |

## Residual fragility

- ChatGPT history/mutation endpoints are private web contracts and may drift without notice. 4xx/5xx/schema failures must remain visible failures.
- Destructive mutation requests have no hidden automatic retry. The user explicitly retries failed items.
- User-turn bookmark injection depends on ChatGPT exposing a safely resolvable turn action cluster. If absent, the extension must not attach the control to another turn.
- DOM selectors can drift; message capture/injection should fail to bind rather than capture the wrong content.
- V1 media is placeholder-only. V1.1 generated binary backup remains #32.
- Legacy whole-conversation Vault rows are not auto-migrated into message-level items because there is no unambiguous intent for which old messages the user meant to save.

## Safety rules

- Delete manual smoke uses intentionally disposable data only.
- Never put real private conversation text/screenshots/exports or ChatGPT auth material in this public repo.
- ChatGPT access tokens remain memory-only; never Supabase/local storage/logs.
- Do not mark #15 DONE from automated tests alone: live private-web behavior needs disposable-account evidence.

## MVP epic (#6) status rule

Do not mark epic #6 DONE until #15, #36, and #20 required USER gates have explicit PASS evidence and `QA.md` release blockers are clear.
