const ACTION_ROW_CURRENT = `
        <div role="group" aria-label="Message actions">
          <button type="button" data-testid="copy-turn-action-button" aria-label="복사">복사</button>
          <button type="button" aria-label="좋은 응답">평가</button>
          <button type="button" aria-label="공유">공유</button>
          <button type="button" aria-label="다시 생성">다시 생성</button>
          <button type="button" aria-label="더보기">...</button>
          <button type="button" aria-label="출처">출처</button>
        </div>
`.trim();

export const CONVERSATION_PAGE_FIXTURE = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Design tokens - ChatGPT</title>
  </head>
  <body>
    <nav>
      <a href="/c/abc-111">Design tokens</a>
      <a href="/c/abc-222">Planning notes</a>
    </nav>
    <main>
      <article data-message-author-role="user" data-message-id="m1">
        <div class="markdown"><p>How should we isolate injected UI?</p></div>
      </article>
      <article data-message-author-role="assistant" data-message-id="m2">
        <div class="markdown">
          <h3>Shadow DOM</h3>
          <p>Use Shadow DOM for injected cleanup UI.</p>
          <pre><code class="language-ts">const root = host.attachShadow({ mode: 'open' });</code></pre>
          <ul><li>Isolate styles</li><li>Keep host CSS out</li></ul>
          <p>See <a href="https://example.com/docs">docs</a>.</p>
          <img alt="diagram omitted" />
        </div>
        ${ACTION_ROW_CURRENT}
      </article>
    </main>
  </body>
</html>
`.trim();

export const LEGACY_ASSISTANT_ACTION_ROW_FIXTURE = `
<!doctype html>
<html>
  <body>
    <article data-message-author-role="assistant" data-message-id="legacy-1">
      <div class="markdown"><p>Legacy action row.</p></div>
      <div data-testid="assistant-action-row" role="group" aria-label="response actions">
        <button type="button">Copy</button>
      </div>
    </article>
  </body>
</html>
`.trim();

export const CURRENT_COPY_TURN_CLUSTER_FIXTURE = `
<!doctype html>
<html>
  <body>
    <article data-testid="conversation-turn-1" data-turn="assistant">
      <div data-message-author-role="assistant" data-message-id="cur-1">
        <div class="markdown"><p>Current copy-turn cluster without a named group.</p></div>
      </div>
      <div class="flex">
        <button type="button" data-testid="copy-turn-action-button" aria-label="복사">복사</button>
        <button type="button" aria-label="공유">공유</button>
        <button type="button" aria-label="더보기">...</button>
        <button type="button" aria-label="출처">출처</button>
      </div>
    </article>
  </body>
</html>
`.trim();

export const WRAPPED_ACTION_ROW_FIXTURE = `
<!doctype html>
<html>
  <body>
    <article data-message-author-role="assistant" data-message-id="wrap-1">
      <div role="group" aria-label="메시지 작업">
        <div><button type="button" data-testid="copy-turn-action-button" aria-label="복사">복사</button></div>
        <div><button type="button" aria-label="다시 생성">다시 생성</button></div>
        <div><button type="button" aria-label="더보기">...</button></div>
        <div><button type="button" aria-label="출처">출처</button></div>
      </div>
    </article>
  </body>
</html>
`.trim();

export const TWO_ASSISTANT_ANSWERS_FIXTURE = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Two answers - ChatGPT</title>
  </head>
  <body>
    <article data-testid="conversation-turn-1" data-turn="user">
      <div data-message-author-role="user" data-message-id="u1">
        <div class="markdown"><p>First question</p></div>
      </div>
    </article>
    <article data-testid="conversation-turn-2" data-turn="assistant">
      <div data-message-author-role="assistant" data-message-id="a1">
        <div class="markdown"><p>First answer</p></div>
      </div>
      ${ACTION_ROW_CURRENT}
    </article>
    <article data-testid="conversation-turn-3" data-turn="user">
      <div data-message-author-role="user" data-message-id="u2">
        <div class="markdown"><p>Second question</p></div>
      </div>
    </article>
    <article data-testid="conversation-turn-4" data-turn="assistant">
      <div data-message-author-role="assistant" data-message-id="a2">
        <div class="markdown"><p>Second answer</p></div>
      </div>
      ${ACTION_ROW_CURRENT}
    </article>
  </body>
</html>
`.trim();

export const CODE_BLOCK_COPY_ONLY_FIXTURE = `
<!doctype html>
<html>
  <body>
    <article data-message-author-role="assistant" data-message-id="code-1">
      <div class="markdown">
        <pre>
          <code>const x = 1;</code>
          <button type="button" data-testid="copy-code-button" aria-label="복사">복사</button>
        </pre>
      </div>
    </article>
  </body>
</html>
`.trim();

export const MISSING_SELECTOR_PAGE_FIXTURE = `
<!doctype html>
<html>
  <body>
    <main>
      <p>ChatGPT-like page with renamed selectors.</p>
      <div class="unknown-turn">Hello</div>
    </main>
  </body>
</html>
`.trim();
