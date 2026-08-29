# Security Baseline

## Threat model

Browser extensions can hold capabilities beyond ordinary web pages. Treat every permission, message bridge, host-page DOM read, network request, and stored value as a security boundary.

## Mandatory controls

### Least privilege

- Request only permissions required for current shipped behavior.
- Prefer `activeTab` over persistent broad host access when possible.
- Prefer optional permissions for features that only some users enable.
- Never add `<all_urls>` for convenience.
- Re-review permissions whenever app scope changes.

### No remote executable code

All executable JS/WASM must ship inside the extension package.

Forbidden:
- remote `<script src>` execution;
- `eval`, `new Function`, string-to-code execution;
- downloading code/config that is interpreted as executable logic;
- remotely hosted WASM used as application code.

Remote data is allowed only when treated as data, validated, and processed by packaged code.

### CSP

Keep extension CSP strict. Do not weaken it merely to make a dependency work. Replace dependencies that require unsafe execution patterns.

### Page/content-script boundary

Host pages are untrusted.

- Do not trust DOM attributes, text, URLs, dataset values, or page-provided JSON.
- Avoid exposing privileged operations to `window.postMessage` without strict origin/schema validation.
- Never forward arbitrary page-supplied commands into `chrome.*` APIs.
- Prefer explicit allowlisted message types.

### Messaging

- Typed discriminated message schema.
- Runtime validation at untrusted boundaries.
- Reject unknown message types.
- Validate sender tab/origin where relevant.
- Keep privileged handlers narrow.

### Storage

Never persist credentials or session material unless unavoidable and explicitly documented.

If sensitive data must be stored:
- minimize fields and lifetime;
- avoid `storage.sync` unless cross-device sync is essential;
- never print values to logs;
- document deletion behavior.

### Network

- Allowlist endpoints.
- Use HTTPS only.
- Validate response shapes.
- Set request timeouts/retry bounds.
- Avoid transmitting page content unless required by the extension's explicit purpose.

### DOM rendering

Prefer `textContent` or safe rendering APIs. Avoid raw `innerHTML` for untrusted data. If HTML rendering is truly necessary, sanitize it with a reviewed local sanitizer.

## Destructive operation security

Bulk delete/archive/edit/send operations require:
- explicit user action;
- deterministic target selection;
- target count preview;
- confirmation for irreversible operations;
- bounded concurrency;
- abort support for long-running batches where practical;
- itemized failures;
- compatibility guard before execution on third-party sites.

Never continue destructive actions after a host adapter detects incompatible DOM/API behavior.

## Dependency review

Before adding a runtime dependency:
- verify active maintenance and ownership;
- inspect whether it uses dynamic code execution;
- inspect transitive dependency growth;
- prefer packages without install scripts;
- pin through the lockfile.

## Secrets

Do not commit:
- API keys;
- OAuth client secrets;
- cookies;
- authorization headers;
- private keys;
- `.env` files with live values;
- exported browsing/user data.

Use `.env.example` with placeholders only when configuration is required.

## Security regression checklist

A change touching permissions, messaging, host access, storage, network, authentication, or third-party DOM integration must answer:

1. Did effective privileges increase?
2. Did a new trust boundary appear?
3. Can hostile page data reach privileged code?
4. Is any executable behavior remotely controlled?
5. Does sensitive data leave the browser?
6. Is failure safe, especially for destructive actions?
