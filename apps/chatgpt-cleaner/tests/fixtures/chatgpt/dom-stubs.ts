/**
 * Sanitized ChatGPT DOM fixture stubs for adapter tests.
 * Contains no personal conversation content or session material.
 */

export const ASSISTANT_ACTION_ROW_FIXTURE = `
<section data-fixture="assistant-action-row">
  <article data-message-author-role="assistant">
    <div class="markdown">Assistant reply placeholder</div>
    <div data-testid="assistant-action-row" role="group" aria-label="response actions">
      <button type="button">Copy</button>
    </div>
  </article>
</section>
`.trim();

export const MISSING_SELECTOR_FIXTURE = `
<main data-fixture="missing-selector">
  <p>Intentionally missing assistant action row markers.</p>
</main>
`.trim();
