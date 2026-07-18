# Context Pack: issue #826 aggregate health

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g1-826-health` |
| Branch         | `fix/826-aggregate-health`                      |
| Current phase  | `plan-eval`                                     |
| Archetype      | `4 - Public DSL / Builder`                      |
| Scope overlays | `service`                                       |

## Current State

PLAN-EVAL passed and slice 1 is implemented/gated. Aggregate health filters `configured: false`
before invocation; all built-in check factories can carry the signal; `defineService` maps
multi-adapter records against `DB_PROVIDER`/`DATABASE_PROVIDER`, so SQLite excludes inactive MySQL.

## Completed

- Read live issue #826, required skills, activation/run-loop, archetype/profile, service overlay,
  gate matrix, plan protocol, relevant doctrine, debt entries, and focused code/tests.
- Identified the four health adapter classes and the aggregate's missing inclusion predicate.
- Defined two implementation slices after the bootstrap slice.
- Implemented and gated slice 1; the full service suite is 83/83 green.

## In Progress

- Bootstrap commit, push, and draft PR creation.

## Next Steps

1. Commit/push/comment slice 1.
2. Implement slice 2 scaffold assertion, run its narrow gate, update artifacts, commit/push/comment.
3. Hand back to supervisor for slice review, full `scaffold.runtime`, CI, and opposite-family eval.

## Key Decisions

| Decision                                         | Source                | Notes                                                                 |
| ------------------------------------------------ | --------------------- | --------------------------------------------------------------------- |
| Explicit optional participation on `HealthCheck` | plan D1               | Defaults preserve current consumers.                                  |
| Filter before invocation                         | plan D2               | Prevents unused adapter side effects and unhealthy results.           |
| Provider-aware multi-adapter composition         | plan D6/D7            | Replaces first-match selection and drives the predicate in real apps. |
| No self-evaluation                               | owner brief / harness | Supervisor controls both evaluator passes.                            |

## Files Changed

| Path                                                        | Status  | Notes                                                        |
| ----------------------------------------------------------- | ------- | ------------------------------------------------------------ |
| `.llm/runs/beta11-cli--orchestrator/slices/g1-826-health/*` | changed | PLAN-EVAL PASS and required scope expansion recorded.        |
| `packages/service/src/primitives/health.ts`                 | changed | Optional adapter configuration and pre-invocation filtering. |
| `packages/service/src/presets/define-service.ts`            | changed | Provider-aware multi-adapter composition.                    |
| `packages/service/tests/health_test.ts`                     | changed | Four adapter exclusion cases and configured failure.         |
| `packages/service/tests/define-service_test.ts`             | changed | SQLite-over-unused-MySQL composition regression.             |
| `packages/service/mod.ts`                                   | changed | Exports adapter option contract.                             |

## Gates

| Gate family | Current status | Evidence                                                   |
| ----------- | -------------- | ---------------------------------------------------------- |
| Static      | PASS           | scoped check/lint/fmt, doc lint, 83 service tests          |
| Fitness     | PASS           | quality scan + architecture check                          |
| Runtime     | PARTIAL        | focused aggregate path PASS; scaffold assertion pending S2 |
| Consumer    | PASS           | type assignability 2/2                                     |

## Open Questions

- None. PLAN-EVAL must verify the locked decisions before implementation.

## Drift and Debt

- Drift: significant host-wiring expansion recorded; authorized by Tier-A PLAN-EVAL review.
- Debt: none created or deepened; existing service Refactor/slow-type debt remains open.

## Commits

- See the draft PR's commit list + per-slice PR comments.
