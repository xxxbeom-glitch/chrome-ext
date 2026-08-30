# ChatGPT 대화 정리 — QA Contract

## 1. Critical user journeys

1. 팝업에서 `대화방 정리하기`를 누르면 ChatGPT cleanup modal이 열린다.
2. 계정 대화 목록이 로드되고 completeness를 과장하지 않는다.
3. 단일 Archive가 정확한 대상에만 적용된다.
4. 다중 Archive가 선택한 대상에만 적용된다.
5. 단일 Delete는 확인 후 실행된다.
6. 다중 Delete는 정확한 대상 개수 확인 후 실행된다.
7. Delete 취소 시 mutation이 0건이다.
8. 부분 실패는 항목별로 보이고 성공으로 숨겨지지 않는다.
9. 실패 항목은 사용자가 명시적으로 다시 시도할 수 있다.
10. ChatGPT 페이지에 bookmark/Vault control이 주입되지 않는다.

## 2. Automated repository gates

최종 MVP:
- [ ] `pnpm verify:repo`
- [ ] lint
- [ ] typecheck
- [ ] unit tests
- [ ] production build
- [ ] extension E2E

## 3. Discovery tests

- [ ] session access token parser
- [ ] conversation response parser
- [ ] pagination
- [ ] end-confirmed semantics
- [ ] malformed response failure
- [ ] DOM fallback does not claim full account history

## 4. Mutation tests

Archive:
- [ ] exact endpoint
- [ ] `PATCH`
- [ ] `{ "is_archived": true }`
- [ ] auth header present
- [ ] non-2xx visible failure
- [ ] automatic destructive retry 없음

Delete:
- [ ] exact endpoint
- [ ] `PATCH`
- [ ] `{ "is_visible": false }`
- [ ] auth header present
- [ ] non-2xx visible failure
- [ ] automatic destructive retry 없음

Safety:
- [ ] Archive never falls through to Delete
- [ ] 401/403 clears cached in-memory token for the next explicit user attempt
- [ ] no session token persistence/logging

## 5. Cleanup domain

- [ ] zero targets
- [ ] one target
- [ ] many targets
- [ ] bounded concurrency
- [ ] partial failure
- [ ] retry failed only
- [ ] duplicate operation protection where implemented
- [ ] exact stable source IDs

## 6. Delete confirmation

- [ ] single target confirmation
- [ ] bulk exact-count confirmation
- [ ] cancellation performs zero mutation
- [ ] double click does not create duplicate destructive command

## 7. Popup / scope regression

- [ ] `대화방 정리하기` 노출
- [ ] `ChatGPT 열기` 노출
- [ ] 테마 선택 노출
- [ ] `북마크한 대화` 미노출
- [ ] Google 로그인/로그아웃 미노출
- [ ] 클라우드/Supabase 상태 미노출

## 8. Manifest regression

- [ ] `storage` permission only for extension permission list
- [ ] `https://chatgpt.com/*` host permission
- [ ] `identity` permission 없음
- [ ] Supabase host permission 없음

## 9. Extension E2E

- [ ] unpacked extension loads
- [ ] popup cleanup actions render
- [ ] content script only injects on ChatGPT host
- [ ] cleanup host mounts
- [ ] bookmark control count = 0
- [ ] no service-worker/manifest errors

Automated E2E must not delete real user conversations.

## 10. Manual smoke before DONE

USER environment에서 의도적으로 버려도 되는 대화만 사용한다.

- [ ] 목록 로드
- [ ] disposable conversation 1개 Archive
- [ ] 실제 ChatGPT에서 보관 상태 확인
- [ ] 다른 disposable conversation 1개 Delete
- [ ] 삭제 확인 UI 확인
- [ ] 실제 ChatGPT에서 삭제/비표시 상태 확인
- [ ] 실패 시 자동 재시도되지 않는지 확인

## 11. Release blockers

다음 중 하나라도 있으면 DONE 금지:
- Delete가 확인 없이 실행됨
- Archive 실패가 Delete로 대체됨
- destructive PATCH 자동 재시도
- 실제 대상 ID와 다른 대화 mutation
- 실패를 성공으로 표시
- popup/ChatGPT에 Vault/bookmark/login UI 노출
- manifest에 불필요한 identity/Supabase permission 존재
- ChatGPT session token 저장/외부 전송
- required QA failure 은폐
