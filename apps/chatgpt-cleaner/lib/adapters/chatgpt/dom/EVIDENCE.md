# ChatGPT assistant action row — locator evidence

Last updated: 2026-08-29

This file records why ChatGPT Cleaner does **not** treat `data-testid="assistant-action-row"` as the live bookmark anchor.

## Observed product failure

On a live ChatGPT conversation (2026-08-29), each assistant answer already showed native controls:

- 복사
- 평가
- 공유
- 다시 생성
- 더보기 (...)
- 출처

The extension bookmark control never appeared.

Root cause in code: `locateBookmarkAnchors()` / `probeCompatibility()` used only

`[data-testid="assistant-action-row"], [data-ce-assistant-actions], div[role="group"][aria-label*="response" i]`

That testid is gone. The live group label is not `*response*` (`Message actions` / localized equivalents such as `回复操作` or `메시지 작업`). `canLocateAssistantActions` was false, so `syncBookmarks()` returned before injection — a silent miss.

## How the live action cluster is identified

Independent public evidence (not guessed from this repo):

1. **copy-turn-action-button** is the stable per-answer copy control used by multiple 2026 clients:
   - [openteam `chatgpt.ts`](https://github.com/afumu/openteam/blob/main/src/content/sites/chatgpt.ts) — `turnCopyButton: button[data-testid="copy-turn-action-button"]`; action group `role="group"` + `Message actions` / `回复操作`
   - [AI-MarkDone](https://github.com/zhaoliangbin42/AI-MarkDone/blob/474834e6/src/drivers/content/adapters/sites/chatgpt.ts) — `getActionBarSelector()` returns `button[data-testid="copy-turn-action-button"]`
   - [codex-chatgpt-web](https://github.com/miuuyy/codex-chatgpt-web/blob/2441ff6b/src/chatgpt-session.ts) — `CHATGPT_COMPLETION_ACTION_SELECTOR`
   - [ai-website-selectors](https://raw.githubusercontent.com/codecrafter97/ai-website-selectors/refs/heads/main/ai-website-selectors.csv) — ChatGPT copy selector `[data-testid='copy-turn-action-button']`

2. Assistant turns are `[data-testid^="conversation-turn-"]` with `data-turn="assistant"` and/or `[data-message-author-role="assistant"]`.

3. Localized copy fallbacks seen in those clients: `Copy`, `Copy response`, `复制`, `复制回复`. This product’s live UI uses **복사**. Code-block copy (`pre` / `copy-code`) is a different control and must not be treated as the turn action row.

4. **출처 / Sources** may sit in the visible action row or, in some A/B tests, only inside 더보기. Insertion is therefore: after 더보기 when present, otherwise before 출처, otherwise at the end of the cluster.

## Chosen locator

1. Legacy CSS still accepted (`assistant-action-row`, `data-ce-assistant-actions`, known group labels) so older fixtures keep working.
2. Primary live path: find `copy-turn-action-button` (or localized turn-copy aria, not inside `pre`/`code`) and walk to the surrounding `[role="group"]` or nearest multi-button cluster. Stop before the turn root.
3. One control per resolved row. Nested duplicate matches keep the innermost cluster.
4. Miss is recorded as:
   - probe reason `assistant action rows not found (copy-turn-action-button / message-actions group)` (internal, not user-facing copy)
   - `html[data-ce-bookmark-compat="missing-action-row"]`

## Not used

- Clicking ChatGPT’s native Copy / More / Sources
- Treating a code-block copy button as an action row
- Broadening permissions
- Changing Vault / Supabase save rules
