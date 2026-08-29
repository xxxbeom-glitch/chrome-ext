# DEC-0001 — GitHub is the collaboration hub

Status: ACCEPTED
Date: 2026-08-29
Scope: repo
Related Issue: #1
Supersedes: NONE

## Context

The repository will contain multiple small Chrome extensions. Work may start in ChatGPT or Cursor, and the user should not have to manually copy implementation state between agents. A workflow based only on chat history is fragile, while a heavyweight external project-management system is unnecessary for this repository.

## Decision

GitHub is the operational collaboration hub.

- `CURRENT.md` is the short current-state checkpoint.
- GitHub Issues carry tasks, handoffs, questions, and review-state transitions.
- Pull requests / commits are implementation evidence.
- GitHub Actions is automated QA evidence.
- `docs/decisions/` stores accepted durable decisions.
- Repository/app SPEC, PERMISSIONS, QA, AGENTS, and Cursor rules remain the authoritative implementation contracts.
- Notion is not part of the operational workflow for this repository.

## Consequences

- Both ChatGPT and Cursor can recover state from GitHub without relying on prior chat context.
- Cursor needs authenticated GitHub access, normally through `gh` CLI; official GitHub MCP is optional.
- One task owner at a time is mandatory.
- GitHub Issue state uses explicit `STATE:` / `OWNER:` headers, so correctness does not depend on optional labels or Projects configuration.
- Because the repository is public, operational content must remain public-safe unless repository visibility is intentionally changed.

## Revisit when

- the number of concurrent contributors or extensions makes one active-Issue checkpoint insufficient;
- GitHub Projects becomes materially useful for scheduling/portfolio management;
- private operational context becomes necessary and repository visibility changes;
- another system provides a demonstrably simpler workflow without reintroducing manual handoff.
