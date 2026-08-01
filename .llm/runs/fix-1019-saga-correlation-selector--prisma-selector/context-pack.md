# Context Pack: Prisma saga correlation selector

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1019-saga-correlation-selector--prisma-selector` |
| Branch | `fix/1019-saga-correlation-selector` |
| Current phase | `handoff` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | none |

## Current State

S1 is implemented and gated. S3 addresses three verified Augment findings in the live integration
test only: destructive-URL safety, exact Prisma 7.8.0 lockstep, and rerun resilience. The owner has
waived a new open-model Plan-Gate; the supervisor retains evaluation ownership.

## Completed

- Doctrine/archetype selection and current verdict review.
- Generated-client evidence for correlation and sibling transition selectors.
- Direction decision: correlation `name:` → `map:`; transition unchanged.

## In Progress

- Supervisor IMPL-EVAL and push handoff.

## Next Steps

1. Commit the validated S3 code and evidence locally without pushing.
2. Hand the commit SHAs to the supervisor for IMPL-EVAL and push.

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
| `packages/plugin-sagas-core/src/stores/prisma-saga-store_integration_test.ts` | changed | S3 safety, version lockstep, unique identities, cleanup |
| `deno.lock` | changed | exact test-only Prisma pins resolved at 7.8.0 |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | requested scoped wrappers and tests |
| Fitness | PASS | per-root doctrine, quality gate, focused JSR audit |
| Runtime | PASS | fresh live Postgres 18.3 round-trip: 7 passed, 0 failed on ephemeral port 44659; rejection path also demonstrated |
| Consumer | PASS | post-fix Prisma 7.8 generated selector is `sagaId_correlationKey` |

## Open Questions

- None blocking for S3.

## Drift and Debt

- Drift: resolved; owner authorized the Opus 5 fix-train evaluator route and restored its verdict.
- Debt: none new or deepened.

## Commits

- S3 implementation: `e2cdb7171` — `test(sagas): harden Prisma integration round-trip`.
- Harness evidence commit follows locally; supervisor owns push and PR comment updates.
