# Context Pack: Prisma saga correlation selector

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1019-saga-correlation-selector--prisma-selector` |
| Branch | `fix/1019-saga-correlation-selector` |
| Current phase | `implement` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | none |

## Current State

Research and design are locked. Prisma 7.8 generation from a wrapper containing the shipped fragment verbatim confirmed the issue cause exactly. Owner-authorized Opus 5 PLAN-EVAL passed with mandatory conditions C1-C3. No product implementation preceded the pass.

## Completed

- Doctrine/archetype selection and current verdict review.
- Generated-client evidence for correlation and sibling transition selectors.
- Direction decision: correlation `name:` → `map:`; transition unchanged.

## In Progress

- Slice 1 implementation, including the ungated schema-derived guard and gated live round-trip.

## Next Steps

1. Implement slice 1 under PLAN-EVAL conditions C1-C3.
2. Run live Postgres round-trip and scoped gates.
3. Hand off to the owner-authorized Opus 5 IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Use `map:` for correlation | plan D1 | Smallest blast radius with generated-client proof. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1019-saga-correlation-selector--prisma-selector/*` | new | Harness bootstrap/plan artifacts only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | Plan-Gate hard stop |
| Fitness | NOT_RUN | Plan-Gate hard stop |
| Runtime | NOT_RUN | Plan-Gate hard stop |
| Consumer | generated pre-fix evidence PASS | temporary Prisma 7.8 generated types |

## Open Questions

- None blocking.

## Drift and Debt

- Drift: resolved; owner authorized the Opus 5 fix-train evaluator route and restored its verdict.
- Debt: none new or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
