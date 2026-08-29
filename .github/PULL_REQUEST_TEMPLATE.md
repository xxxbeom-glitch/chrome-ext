## Related task

Closes / relates to: #

## Review mode

- `SELF` / `CHATGPT` / `USER`
- Reviewer/owner at REVIEW state: `CURSOR` / `CHATGPT` / `USER`

For `SELF`, Cursor must perform a distinct second-pass review after implementation evidence is complete.

## Scope

What this PR changes:

What this PR intentionally does **not** change:

## Implementation

- 

## Permission / data impact

- Manifest permission change: NONE / DOCUMENTED
- Host permission change: NONE / DOCUMENTED
- New stored data: NONE / DOCUMENTED
- New external transmission: NONE / DOCUMENTED
- Destructive behavior change: NONE / DOCUMENTED

If any item is DOCUMENTED, link the updated SPEC / PERMISSIONS / Decision.

## QA evidence

- [ ] `pnpm verify:repo`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm test:e2e` or explicitly not applicable
- [ ] manual smoke when runtime/browser behavior changed
- [ ] light/dark/system review when UI changed
- [ ] keyboard/focus review when UI changed
- [ ] host-page style isolation review when injected UI changed

## Self-review evidence

Required when Review mode is `SELF`:

- [ ] Acceptance Criteria re-checked after implementation
- [ ] final diff checked for scope creep / unrelated changes
- [ ] permission/privacy/data impact re-checked
- [ ] residual risk and `Not done` re-checked

## Result

What is now true after this PR?

## Residual risk

Known fragility, untested environment, private API/DOM dependency, or `NONE`.

## Not done

Explicitly list intentionally incomplete follow-up work or `NONE`.
