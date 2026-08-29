export const CONVERSATION_PAGE_FIXTURE = `
<!doctype html>
<html>
  <head><title>Design tokens - ChatGPT</title></head>
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
        <div data-testid="assistant-action-row" role="group" aria-label="response actions">
          <button type="button">Copy</button>
        </div>
      </article>
    </main>
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
