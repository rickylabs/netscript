# Context Pack: Prisma saga correlation selector

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1019-saga-correlation-selector--prisma-selector` |
| Branch | `fix/1019-saga-correlation-selector` |
| Current phase | `gate` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | none |

## Current State

S1 is implemented and gated. Prisma 7.8 now generates `sagaId_correlationKey`; the ungated schema-derived guard passes, and the required live round-trip passed against Postgres 18.3 using the shipped fragment verbatim. C2/C3 are disclosed in PR #1032.

## Completed

- Doctrine/archetype selection and current verdict review.
- Generated-client evidence for correlation and sibling transition selectors.
- Direction decision: correlation `name:` → `map:`; transition unchanged.

## In Progress

- Slice 1 implementation and all scoped generator gates.

## Next Steps

1. Commit/push S1 and post exact PR evidence.
2. Hand off to the owner-authorized Opus 5 IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Use `map:` for correlation | plan D1 | Smallest blast radius with generated-client proof. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1019-saga-correlation-selector--prisma-selector/*` | new | Harness bootstrap/plan artifacts only. |
| `plugins/sagas/database/sagas.prisma` | changed | correlation unique uses `map:` |
| `packages/plugin-sagas-core/src/stores/prisma-saga-store.ts` | changed | single selector constant drives all store usage |
| `packages/plugin-sagas-core/src/stores/prisma-saga-store_test.ts` | changed | ungated shipped-schema guard and aligned fake |
| `packages/plugin-sagas-core/src/stores/prisma-saga-store_integration_test.ts` | new | gated real Prisma/Postgres round-trip |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | requested scoped wrappers and tests |
| Fitness | PASS | per-root doctrine, quality gate, focused JSR audit |
| Runtime | PASS | live Postgres 18.3 round-trip: 1 passed, 0 failed |
| Consumer | PASS | post-fix Prisma 7.8 generated selector is `sagaId_correlationKey` |

## Open Questions

- None blocking.

## Drift and Debt

- Drift: resolved; owner authorized the Opus 5 fix-train evaluator route and restored its verdict.
- Debt: none new or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
