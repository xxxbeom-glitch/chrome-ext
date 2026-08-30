# ChatGPT 대화 정리 — Permissions Review

## Effective permission table

| Permission / host | User-visible feature | Why needed | Optional? |
|---|---|---|---|
| `storage` | 테마 등 비민감 UI 설정 유지 | popup/service-worker lifecycle 이후에도 설정 유지 | No |
| `https://chatgpt.com/*` | cleanup modal, 대화 목록 discovery, Archive/Delete | 제품의 단일 기능이 ChatGPT에서 동작해야 함 | No |

## Explicitly not requested

- `identity` — 현재 Google 로그인/Vault 없음.
- Supabase host permission — 현재 클라우드 저장/동기화 없음.
- `<all_urls>` — 금지.
- `tabs` — 현재 host permission + 기본 tabs API 사용으로 충분하면 요청하지 않음.
- `scripting` — 정적 WXT content-script 등록으로 충분.
- `webRequest` / `webRequestBlocking` — 범위 밖.
- `cookies` — ChatGPT 쿠키/세션을 일반 확장 권한으로 읽거나 저장하지 않음.
- `history`, `downloads`, `clipboardRead`, `clipboardWrite` — 현재 요구 없음.

## ChatGPT host-access constraints

Host access는 아래 기능에만 사용한다.
- 계정 대화 목록 discovery
- 사용자가 실행한 Archive
- 사용자가 확인한 Delete

메시지 북마크, 대화 스냅샷 저장, 광고/백그라운드 감시, 별도 데이터 수집에는 사용하지 않는다.

Private-web endpoint를 사용하더라도 ChatGPT access token은 메모리에서만 사용하며 저장/로그/제3자 전송하지 않는다.

## Review questions for permission changes

- 더 좁은 권한으로 가능한가?
- 실제 shipping code가 지금 사용하는 권한인가?
- cleanup-only 단일 목적을 벗어나는가?
- 새 Chrome 설치 경고를 만드는가?
- `PRODUCT.md`, `SPEC.md`, privacy/data behavior와 일치하는가?

현재 manifest에 `identity` 또는 Supabase host permission이 다시 추가되면 명시적 USER 결정 없이는 blocker다.
