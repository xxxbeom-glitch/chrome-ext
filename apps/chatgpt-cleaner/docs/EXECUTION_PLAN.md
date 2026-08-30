# ChatGPT 대화 정리 — Cursor Execution Plan

Default review mode: `SELF`.

## 1. Start sequence

1. sync latest `main`;
2. read root `CURRENT.md`;
3. read active GitHub Issue;
4. read root/app `AGENTS.md` and app docs;
5. run `pnpm agent:check`;
6. confirm current work is inside cleanup-only scope.

## 2. Current MVP scope

Implement and maintain only:
- conversation list discovery
- search/selection
- Archive
- Delete with explicit confirmation
- progress/failure/retry UI
- popup launcher
- theme/accessibility

Do not reintroduce Vault/bookmark/cloud/auth/media features without explicit USER decision.

## 3. Work loop

```text
Recover state
→ claim Issue
→ implement smallest cleanup-only change
→ tests/docs
→ repository QA
→ SELF review
→ DONE or precise USER blocker
→ update CURRENT.md
```

## 4. Phase A — Discovery

Required:
- same-origin ChatGPT session token retrieval
- paginated account conversation list
- response-shape validation
- honest completeness state
- DOM fallback only when needed

Acceptance:
- signed-in account list loads
- sidebar collapsed state does not create a fake empty account
- fallback never claims `endConfirmed` without evidence

## 5. Phase B — Cleanup UI

Required:
- centered isolated overlay
- search
- row selection
- select all
- per-row Archive/Delete
- bulk Archive/Delete
- selected count
- loading/success/failure states

Acceptance:
- no bookmark/Vault/auth UI
- Delete confirmation is explicit
- bulk Delete confirmation displays exact target count

## 6. Phase C — Archive/Delete binding

Required:
- Archive: `PATCH /backend-api/conversation/{id}` + `{ "is_archived": true }`
- Delete: `PATCH /backend-api/conversation/{id}` + `{ "is_visible": false }`
- access token memory-only
- no hidden retry
- separate operations
- per-item error handling

Acceptance:
- exact request tests pass
- non-2xx fails visibly
- Archive never substitutes Delete
- Delete cancel creates zero mutation

## 7. Phase D — Release hardening

Required:
- manifest contains only current permissions
- popup exposes cleanup-only actions
- content script does not inject bookmark controls
- repository policy/lint/typecheck/unit/build/E2E green
- no secrets or private chat data in repo/logs

## 8. Manual USER gate

Automated testing must not mutate real user data.

Before DONE, USER verifies with intentionally disposable conversations:
1. Archive one disposable conversation.
2. Confirm it is archived in ChatGPT.
3. Delete a different disposable conversation after explicit confirmation.
4. Confirm it is removed/unavailable as expected.

## 9. Stop conditions

Ask USER only when:
- ChatGPT private-web contract changed and a new behavior choice is needed;
- a new permission/data collection mechanism would be required;
- destructive semantics/confirmation would change;
- a Vault/bookmark/cloud feature is being proposed again;
- no disposable conversation exists for required live mutation smoke.
