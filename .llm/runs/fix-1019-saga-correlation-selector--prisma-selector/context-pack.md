# Context Pack: Prisma saga correlation selector

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1019-saga-correlation-selector--prisma-selector` |
| Branch | `fix/1019-saga-correlation-selector` |
| Current phase | `plan-eval` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | none |

## Current State

Research and design are locked. Prisma 7.8 generation from a wrapper containing the shipped fragment verbatim confirmed the issue cause exactly. No product implementation has begun.

## Completed

- Doctrine/archetype selection and current verdict review.
- Generated-client evidence for correlation and sibling transition selectors.
- Direction decision: correlation `name:` → `map:`; transition unchanged.

## In Progress

- Separate-session PLAN-EVAL.

## Next Steps

1. Obtain PLAN-EVAL PASS.
2. Open/advance the draft PR and implement slice 1.
3. Run live Postgres round-trip and scoped gates.

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

- Drift: none.
- Debt: none new or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
