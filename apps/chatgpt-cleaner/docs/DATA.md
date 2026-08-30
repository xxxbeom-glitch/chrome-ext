# ChatGPT 대화 정리 — Data Contract

## 1. Current data model

현재 cleanup-only MVP는 ChatGPT 대화 콘텐츠를 별도 backend/database에 저장하지 않는다.

Supabase와 Google Auth는 현재 shipping flow에서 사용하지 않는다.

## 2. Data read from ChatGPT

정리 화면을 위해 필요한 최소 메타데이터만 현재 세션에서 읽는다.

- conversation ID
- title
- source URL
- update/create time when available

Archive/Delete를 위해 conversation ID를 사용한다.

대화 본문/메시지 내용은 현재 cleanup 기능에 필요하지 않으며 별도 Vault에 저장하지 않는다.

## 3. Session/auth material

`/api/auth/session`에서 얻는 access token은 same-origin ChatGPT private-web 요청에만 사용한다.

Rules:
- 메모리 전용
- `chrome.storage` 저장 금지
- 로그 금지
- GitHub Issue/commit 저장 금지
- Supabase/제3자 전송 금지

## 4. Local extension storage

허용:
- theme preference
- 비민감 UI preference
- 안전한 operation recovery metadata가 실제로 필요한 경우

금지:
- ChatGPT access token/cookie
- 대화 본문 snapshot
- 메시지 bookmark content

## 5. Backend

현재 MVP는 별도 cloud backend를 필요로 하지 않는다.

Repository에 남아 있는 과거 Vault/Supabase prototype 코드나 migration은 current runtime contract가 아니다. 사용자가 Vault 기능을 명시적으로 재도입하기 전까지 shipping flow에서 호출하거나 권한을 추가하지 않는다.

## 6. Data deletion behavior

Archive:
- ChatGPT 자체 conversation 상태만 변경한다.

Delete:
- 사용자가 확인한 ChatGPT conversation에 대해서만 비표시/delete mutation을 보낸다.

확장프로그램이 별도 conversation copy를 보관하지 않으므로 cleanup 후 extension-owned cloud copy가 남지 않는다.

## 7. Privacy invariant

현재 제품의 데이터 원칙은 다음 한 문장으로 요약된다.

> 대화 목록 정리에 필요한 최소 메타데이터만 현재 세션에서 처리하고, ChatGPT 대화 콘텐츠를 별도 클라우드에 저장하지 않는다.
