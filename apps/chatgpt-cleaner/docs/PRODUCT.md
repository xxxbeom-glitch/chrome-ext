# ChatGPT 대화 정리 — Product Definition

Status: current MVP contract

## 1. Product purpose

ChatGPT 대화 목록을 한 번에 불러와 여러 대화를 빠르게 **보관(Archive)** 또는 **삭제(Delete)** 할 수 있게 한다.

현재 MVP는 이 한 가지 목적만 가진다.

## 2. In scope

- ChatGPT 계정 대화 목록 불러오기
- 검색/선택
- 단일 보관
- 다중 보관
- 단일 삭제
- 다중 삭제
- 삭제 전 명시적 확인
- 항목별 진행/성공/실패 표시
- 실패 항목만 사용자가 다시 시도 가능
- 목록 전체 로딩 여부를 과장하지 않는 completeness 표시

## 3. Out of scope

현재 MVP에서는 아래 기능을 제공하지 않는다.

- 메시지 단위 북마크/저장
- 전체 대화 스냅샷 저장
- Conversation Vault / 보관함 페이지
- 이미지/파일 백업
- Supabase 클라우드 저장
- Google 로그인
- ChatGPT 대화 콘텐츠를 별도 DB에 저장하는 기능

해당 기능은 사용자가 별도로 재결정하기 전까지 구현/노출하지 않는다.

## 4. Popup

팝업은 가벼운 실행기다.

노출 기능:
- **대화방 정리하기**
- **ChatGPT 열기**
- 테마 선택

보관함/로그인/동기화 UI는 노출하지 않는다.

## 5. Cleanup modal

ChatGPT 위에 확장프로그램 소유의 모달을 띄운다.

필수 요소:
- 검색
- 전체 선택
- 선택 개수
- 대화 제목/메타
- 행별 보관/삭제
- 일괄 보관/삭제
- 진행 상태
- 항목별 성공/실패
- 실패 항목 재시도

## 6. Archive behavior

- 사용자가 선택한 대화 ID만 대상으로 한다.
- Archive와 Delete는 완전히 별도 동작이다.
- Archive 실패가 Delete로 대체되어서는 안 된다.
- 자동 재시도하지 않는다.

## 7. Delete behavior

- 삭제는 실행 전에 명시적 확인을 요구한다.
- 다중 삭제는 정확한 대상 개수를 표시한다.
- 취소 시 네트워크 mutation은 0건이어야 한다.
- 실패 항목은 실패 상태로 남기고 사용자가 명시적으로 다시 시도한다.
- 자동 재시도하지 않는다.

## 8. ChatGPT integration

목록 조회와 보관/삭제는 현재 ChatGPT 웹에서 사용되는 same-origin private-web 계약을 어댑터 내부에 격리한다.

현재 mutation 계약:
- Archive: `PATCH /backend-api/conversation/{id}` + `{ "is_archived": true }`
- Delete: `PATCH /backend-api/conversation/{id}` + `{ "is_visible": false }`

이 계약은 공개 API가 아니므로 변경될 수 있다. 요청/응답이 예상과 다르면 성공으로 추정하지 않고 실패를 그대로 표시한다.

ChatGPT 세션 토큰은 메모리에서만 사용하고 저장/로그/외부 전송하지 않는다.

## 9. Permissions

현재 MVP에 필요한 권한만 사용한다.

- `storage` — 테마/비민감 UI 설정
- `https://chatgpt.com/*` — ChatGPT 페이지 및 same-origin cleanup 요청

`identity`, Supabase host permission 등 Vault/로그인용 권한은 현재 MVP에서 제거한다.

## 10. Acceptance criteria

- 실제 계정 대화 목록이 로드된다.
- 단일/다중 Archive가 정확한 대상에만 적용된다.
- 단일/다중 Delete가 확인 후 정확한 대상에만 적용된다.
- 취소된 Delete는 mutation을 발생시키지 않는다.
- 부분 실패가 성공으로 숨겨지지 않는다.
- Archive가 Delete로 fall-through 하지 않는다.
- destructive PATCH 자동 재시도가 없다.
- 팝업/ChatGPT 페이지 어디에도 북마크/Vault/Google 로그인 UI가 노출되지 않는다.
- 빌드된 manifest에 `identity`/Supabase host permission이 없다.
- 저장된 ChatGPT 메시지/대화 콘텐츠가 별도 Vault DB로 전송되지 않는다.
