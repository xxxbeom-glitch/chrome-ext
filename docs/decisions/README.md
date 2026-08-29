# Decisions

Store only durable decisions here. GitHub Issues are for discussion; accepted durable outcomes are summarized as decision records.

## Naming

```text
DEC-0001-short-title.md
DEC-0002-short-title.md
```

IDs are monotonically increasing across the repository.

## Required format

```markdown
# DEC-0001 — Title

Status: ACCEPTED | SUPERSEDED | REJECTED
Date: YYYY-MM-DD
Scope: repo | <app-slug>
Related Issue: #N
Supersedes: NONE | DEC-XXXX

## Context

## Decision

## Consequences

## Revisit when
```

Do not create a decision record for ordinary implementation details that can be changed locally without affecting product meaning, permissions, privacy, architecture, destructive behavior, shared design-system behavior, distribution policy, or collaboration rules.
