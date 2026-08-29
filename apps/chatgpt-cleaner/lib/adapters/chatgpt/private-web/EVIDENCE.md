# ChatGPT conversation history — discovery evidence

Last updated: 2026-08-29

This file records why ChatGPT Cleaner does **not** treat visible sidebar links as the account history, and why a same-origin private-web list request is used.

## Observed product failure

Opening the cleanup overlay on a real ChatGPT account showed:

- `0개 대화 발견 · 완전성 미확인`
- English diagnostic `conversation links not found`
- empty copy `대화가 없습니다`

Root cause in code: `discoverConversationsFromDom()` only ran `querySelectorAll('a[href^="/c/"]')` on the current document. A collapsed, lazy, or virtualized sidebar has no those anchors, so a non-empty account looked empty.

That is a visible-DOM scrape, not account history.

## How the ChatGPT web client loads history

Independent public evidence (not guessed from this repo):

1. **OpenAI community (2026)** — the live web client lists history with  
   `GET /backend-api/conversations?offset=0&limit=28&order=updated_at…`  
   and continues at offsets `28`, `56`, … until the list is exhausted.  
   https://community.openai.com/t/chatgpt-web-conversation-history-returns-persistent-429-rate-limit-and-fails-to-load/1391615

2. **everything-chatgpt** — documents  
   `GET /api/auth/session` → `accessToken`  
   then `GET /backend-api/conversations?offset=0&limit=28`  
   with pagination via increasing `offset`. Response shape: `{ items: [{ id, title, create_time, update_time, … }], total, limit, offset }`.  
   The UI “Show more” control uses `offset=28`.

3. **Chrome extension clients (stash, kept, ai-vault)** — same two same-origin URLs on `chatgpt.com`:
   - `GET /api/auth/session` (cookies; no Authorization header)
   - `GET /backend-api/conversations?offset=&limit=&order=updated` with `Authorization: Bearer <accessToken>`

4. **0xdevalias gist** — response `{ items, limit, offset, total }`; `limit` must be `<= 100`.

## Chosen approach (B, with DOM fallback)

- From the ChatGPT content-script origin, reuse the **same-origin** session + conversations list the page already uses.
- Access token is read **in memory for this discovery run only**. Never written to `chrome.storage`, logs, or Supabase.
- Response is schema-validated. Drift → fail closed (not a fake empty list).
- Pagination uses `offset` / `limit` (28, matching the live UI page size).
- `endConfirmed` only when a validated page proves the end (`items.length === 0`, `items.length < limit`, or `offset + items.length >= total`).
- If the private-web request fails, fall back to whatever `/c/` links are in the DOM and mark `hasMore` / never claim the full account list.
- Archive/Delete stay fail-closed. This adapter is read-only list.

## Not used

- Guessed undocumented hosts outside `chatgpt.com`
- Extra permissions (`scripting`, `cookies`, `<all_urls>`)
- Treating “currently rendered sidebar rows” as `endConfirmed`
