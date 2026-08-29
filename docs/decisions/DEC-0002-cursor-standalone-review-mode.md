# DEC-0002 — Cursor standalone review mode

Status: Accepted
Date: 2026-08-29

## Context

The repository must support two valid operating styles:

1. ChatGPT and Cursor collaborating through GitHub; and
2. the user working only with Cursor for an extended sequence of tasks.

The previous workflow made ChatGPT the default post-implementation reviewer. That created an unnecessary dependency for routine implementation work even when the task was explicit, low-risk, fully testable, and already within established product/engineering policy.

## Decision

GitHub remains the operational hub in both modes. ChatGPT is an optional reviewer, not a mandatory hop.

Every executable task declares a `REVIEW_MODE`:

- `SELF` — Cursor performs implementation and a separate evidence-based self-review pass, then may mark the task DONE.
- `CHATGPT` — Cursor hands implementation evidence to ChatGPT for review.
- `USER` — the user performs final product judgment or explicitly accepts/rejects the result.

`SELF` is the default for routine implementation work that stays within approved scope, permissions, architecture, data behavior, destructive-action policy, and durable decisions.

A task must escalate to `DECISION_NEEDED` before implementation when it introduces an unresolved material decision. Once that decision is recorded, the implementation may return to `SELF` review unless the user explicitly requests ChatGPT or User review.

Cursor self-review is not equivalent to skipping review. It requires a second pass after implementation that checks the diff, acceptance criteria, QA evidence, scope, permissions/data impact, residual risk, and intentionally unfinished work.

## Consequences

- The user can run a complete GitHub-backed workflow using Cursor alone.
- ChatGPT remains available for planning, adversarial review, policy interpretation, difficult debugging, or optional second-opinion review.
- Routine tasks no longer block on ChatGPT availability.
- High-impact decisions still require explicit user/decision handling rather than being silently inferred by Cursor.
- All modes retain the same GitHub Issue, commit/PR, CI, and CURRENT.md audit trail.

## Supersedes / amends

Amends DEC-0001 by removing ChatGPT as a mandatory default reviewer while preserving GitHub as the collaboration and state hub.
