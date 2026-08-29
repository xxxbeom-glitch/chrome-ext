# ChatGPT Cleaner + Conversation Vault — QA Contract

## 1. Critical user journeys

1. Popup opens ChatGPT and launches the cleanup modal.
2. Cleanup modal progressively discovers conversations and reports completeness honestly.
3. Single Archive succeeds/fails visibly without confirmation.
4. Single Delete requires confirmation and reports the exact item result.
5. Multi-select Archive runs with bounded concurrency and itemized outcomes.
6. Multi-select Delete requires exact target-count confirmation and itemized outcomes.
7. ChatGPT compatibility failure disables destructive operations instead of guessing.
8. Bookmark control injects once per assistant action row and survives SPA navigation/rerender.
9. Bookmark captures a complete V1 conversation snapshot and persists it to the Vault.
10. Re-bookmarking the same conversation updates one complete snapshot and adds/reuses anchors.
11. A partial capture never overwrites the last complete snapshot.
12. Vault copy remains readable after the source ChatGPT conversation is archived/deleted.
13. Extension account login on another browser environment restores Vault data.
14. Vault deletion affects only the Vault and requires confirmation.

## 2. Automated repository gates

Every implementation phase must run the relevant subset; final MVP must pass all:

- [ ] `pnpm verify:repo`
- [ ] lint
- [ ] typecheck
- [ ] unit tests
- [ ] production build
- [ ] extension E2E

No ignored TypeScript/test failures may be introduced to make a phase pass.

## 3. Unit-test requirements

### ChatGPT adapter
- [ ] compatibility probe success/failure
- [ ] conversation-list parser/response parser fixtures
- [ ] pagination/end-confirmed semantics
- [ ] missing/renamed selector behavior
- [ ] action-row detection
- [ ] idempotent bookmark injection decision
- [ ] mutation result parsing
- [ ] malformed/unknown private-web response fails closed if private adapter exists

### Snapshot parser
- [ ] user/assistant message ordering
- [ ] paragraphs/headings/lists/quotes
- [ ] code blocks + language hints
- [ ] links
- [ ] tables
- [ ] unsupported media placeholder
- [ ] stable source message ID when present
- [ ] deterministic fallback anchor when absent
- [ ] completeness detection
- [ ] malicious/untrusted HTML is not persisted as executable markup

### Cleanup domain
- [ ] zero targets
- [ ] one target
- [ ] many targets
- [ ] bounded concurrency
- [ ] partial failure
- [ ] retry failed only
- [ ] abort/stop where implemented
- [ ] duplicate operation-ID protection
- [ ] Archive cannot fall through to Delete

### Vault/data
- [ ] same source conversation upserts one snapshot
- [ ] multiple bookmark anchors preserved
- [ ] duplicate anchor prevented
- [ ] partial snapshot cannot replace complete snapshot
- [ ] cloud error returns failure, not success
- [ ] sign-out clears user cache/session state
- [ ] user-scoped query wrapper always includes authenticated context as designed

## 4. DOM fixtures

Maintain sanitized HTML/structured fixtures representing the current known ChatGPT surfaces used by the adapter.

At minimum include:
- conversation page with multiple user/assistant turns;
- assistant action row;
- code block/table/link examples;
- unsupported media example;
- intentionally changed/missing selector fixture.

Fixtures must contain no real personal conversation data or auth/session material.

## 5. Extension E2E requirements

Use persistent Chromium with the built unpacked extension.

Required scenarios:
- [ ] extension loads without manifest/service-worker error
- [ ] popup primary actions work
- [ ] content script injects only on allowed ChatGPT host
- [ ] cleanup modal opens/closes and traps/restores focus correctly
- [ ] injected UI is style-isolated from host page
- [ ] bookmark button is not duplicated after SPA navigation/rerender
- [ ] mocked/stubbed cleanup operation exposes progress + failures correctly
- [ ] Vault page renders a saved structured snapshot safely
- [ ] local preference persists across extension reload
- [ ] service-worker termination/restart does not create an unsafe duplicate destructive action

Real ChatGPT mutation E2E should be a controlled/manual lane unless a safe disposable test target is available. Never mass-delete real user data as an automated test.

## 6. Supabase/auth QA

Before real-cloud MVP completion:
- [ ] migration applies cleanly to a test/dev project
- [ ] RLS enabled on all user-data tables
- [ ] authenticated user can CRUD only own Vault data
- [ ] unauthenticated request cannot read/write Vault records
- [ ] simulated second user cannot read/write first user's records
- [ ] Google login callback returns to extension successfully
- [ ] new browser/profile login restores existing Vault list
- [ ] sign-out removes local user-specific state
- [ ] no service-role/client secret appears in built extension

If Supabase credentials/config are not yet available, all non-cloud tests must still run and the missing real-cloud gate must be reported explicitly as BLOCKED/NOT_RUN rather than faked.

## 7. Visual/theme QA

- [ ] Pretendard comes from bundled shared package
- [ ] light theme
- [ ] dark theme
- [ ] system theme
- [ ] visible keyboard focus
- [ ] modal focus trap and escape behavior
- [ ] hover/pressed/selected/disabled/loading states
- [ ] destructive action distinction
- [ ] selected-count clarity
- [ ] long titles truncate/wrap correctly
- [ ] empty/loading/error/partial-failure states
- [ ] reduced motion
- [ ] no ChatGPT CSS leakage into extension UI
- [ ] no extension reset/style leakage into ChatGPT

## 8. Cleaner destructive QA matrix

### Archive
- [ ] single
- [ ] bulk
- [ ] partial failure
- [ ] retry failed only
- [ ] list state updates by stable source ID

### Delete
- [ ] single target confirmation
- [ ] bulk exact-count confirmation
- [ ] cancellation performs zero mutation
- [ ] partial failure
- [ ] retry failed only
- [ ] compatibility probe failure performs zero mutation
- [ ] duplicated user click cannot create duplicate destructive command

## 9. Snapshot/Vault QA matrix

- [ ] complete text-only conversation
- [ ] Markdown-rich conversation
- [ ] code/table/link conversation
- [ ] unsupported media represented honestly
- [ ] first bookmark creates snapshot + anchor
- [ ] second bookmark same conversation updates snapshot + retains first anchor
- [ ] same response re-bookmark does not duplicate anchor
- [ ] capture partial after earlier complete save preserves earlier complete data
- [ ] source link unavailable does not break Vault reader
- [ ] source ChatGPT deletion does not delete Vault record
- [ ] Vault deletion does not delete ChatGPT source

## 10. Manual smoke before declaring MVP DONE

- [ ] production build loaded unpacked
- [ ] real ChatGPT current UI compatibility checked
- [ ] at least one disposable/non-critical conversation Archive tested
- [ ] Delete tested only on an intentionally disposable conversation
- [ ] bookmark/save tested on a non-sensitive test conversation
- [ ] saved snapshot opened from Vault
- [ ] source test conversation deleted and Vault copy verified to remain
- [ ] restart Chrome / extension and verify persistence
- [ ] second Chrome profile/device-like environment verifies cloud restore
- [ ] console contains no sensitive content/session logs
- [ ] network destinations are only expected ChatGPT/Supabase/auth endpoints
- [ ] effective manifest matches `PERMISSIONS.md`

## 11. Release blockers

Do not mark MVP DONE if any of these are true:
- destructive action can run when compatibility is unknown;
- Delete can run without the defined confirmation;
- UI claims `all conversations` without confirmed end-of-list;
- Vault UI claims successful save before persistence confirmation;
- partial capture can overwrite complete snapshot;
- ChatGPT auth/session data is persisted or transmitted to Supabase;
- RLS isolation is unverified;
- remote executable code exists;
- required QA failure is hidden or marked as passed without evidence.

## 12. Result record

For each phase Issue, record:
- commit/PR;
- automated QA results;
- manual QA performed/not performed;
- residual risk;
- intentionally unfinished work;
- SELF review conclusion.
