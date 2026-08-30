# ChatGPT 대화 정리 — Technical SPEC

Status: cleanup-only MVP

## 1. Single purpose

현재 확장프로그램의 단일 목적은 ChatGPT 대화 목록을 불러와 사용자가 선택한 대화를 **보관** 또는 **삭제**하는 것이다.

메시지 저장/Vault/클라우드 동기화는 현재 런타임 범위가 아니다.

## 2. Target host

- `https://chatgpt.com/*`

추가 외부 API host permission은 현재 필요하지 않다.

## 3. Entrypoints

- background service worker — ChatGPT 탭 열기/포커스, cleanup overlay 실행 조정
- content script — 대화 목록 discovery, cleanup UI, Archive/Delete mutation
- popup — cleanup 실행기와 ChatGPT 열기, 테마 선택

Vault/auth entrypoint는 현재 제품 흐름에서 사용하지 않는다.

## 4. Discovery

Primary:
- `GET /api/auth/session`
- paginated `GET /backend-api/conversations`

Fallback:
- 현재 DOM에 렌더링된 `/c/` 링크

Fallback 결과는 계정 전체 목록이라고 주장하지 않는다.

## 5. Mutations

Private-web mutation adapter를 통해서만 수행한다.

Archive:
```text
PATCH /backend-api/conversation/{conversationId}
{ "is_archived": true }
```

Delete:
```text
PATCH /backend-api/conversation/{conversationId}
{ "is_visible": false }
```

Rules:
- ChatGPT access token은 메모리에서만 사용한다.
- mutation 요청은 자동 재시도하지 않는다.
- Archive 실패를 Delete로 대체하지 않는다.
- 4xx/5xx/schema drift는 성공으로 추정하지 않는다.
- 실패 항목은 사용자에게 그대로 노출하고 명시적 재시도만 허용한다.

## 6. Cleanup UI

필수 상태:
- loading
- idle
- selected
- running
- succeeded
- failed
- skipped

Delete는 반드시 명시적 확인 후 실행한다.
다중 Delete 확인 문구는 대상 개수를 정확히 표시한다.

작업 대상은 확인 시점의 stable conversation ID snapshot으로 고정한다.

## 7. Popup

노출:
- 대화방 정리하기
- ChatGPT 열기
- 테마

노출하지 않음:
- 북마크
- Vault
- Google 로그인
- Supabase 상태/동기화

## 8. Permissions

Manifest:
- permissions: `storage`
- host permissions: `https://chatgpt.com/*`

현재 scope에서 `identity` 및 Supabase host permission은 금지한다.

## 9. Security

- ChatGPT session/access token 저장 금지
- ChatGPT credential을 Supabase/제3자에 전송 금지
- remote executable code 금지
- `eval` / `new Function` 금지
- public repository에 실제 대화/토큰/쿠키/스크린샷/exports 저장 금지

## 10. Failure behavior

- discovery 실패: 목록 로딩 실패를 명확히 표시
- Archive/Delete 실패: 해당 항목 실패 표시
- 일부 성공: 성공 항목과 실패 항목을 구분
- auth/session 만료: 실패 표시, 자동으로 destructive request 재전송하지 않음
- unknown compatibility: 임의 endpoint/대체 동작을 추측하지 않음

## 11. Acceptance criteria

- 계정 대화 목록 조회
- 단일/다중 Archive
- 단일/다중 Delete + 확인
- Delete 취소 시 mutation 0건
- 부분 실패 표시
- failed-only explicit retry
- destructive request 자동 retry 없음
- Archive/Delete 분리
- popup/ChatGPT에 bookmark/Vault UI 없음
- manifest에 identity/Supabase permission 없음
- repository QA green
- 실제 disposable conversation으로 Archive 1건/Delete 1건 USER smoke
