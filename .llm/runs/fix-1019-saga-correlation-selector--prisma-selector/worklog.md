# Worklog: Prisma saga correlation selector

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1019-saga-correlation-selector--prisma-selector` |
| Branch | `fix/1019-saga-correlation-selector` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | none |

## Design

### Public Surface

- No TypeScript export changes.
- Published `plugins/sagas/database/sagas.prisma` remains the database contract.

### Domain Vocabulary

- `SagaRuntimeCorrelationWhereUniqueInput` — generated Prisma selector contract.
- `SAGA_PRISMA_TEST_DATABASE_URL` — explicit opt-in for live integration execution.

### Ports

- `PrismaSagaStoreClient` — existing narrow client surface; no new port.

### Constants

- No new finite runtime vocabulary; the test environment variable is a test-edge constant.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove and align the shipped selector; add schema-driven live round-trip | Prisma generate + live test + scoped static/tests | `plugins/sagas/database/sagas.prisma`, saga-store tests/support, run artifacts |
| 2 | Record full gate and evaluator evidence | requested validation + quality/JSR/doctrine gates | run artifacts and PR evidence only |

### Deferred Scope

- Transition compound-ID selector normalization — no current consumer, so it remains latent and unchanged.

### Contributor Path

Change the shipped fragment, regenerate Prisma 7.8 types to confirm the input key, then run the opt-in Postgres test; never update only the memory fake.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | plan | research | Prisma 7.8 generated the reported named selector; lock churn removed. |
| 2026-08-01 | plan-eval | launch | Canonical Qwen route blocked: OpenRouter credential absent; product implementation remains stopped. |
| 2026-08-01 | plan-eval | owner override | Opus 5 supervisor PLAN-EVAL restored as authoritative; PASS conditional on C1-C3. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| `name:` → `map:` for correlation only | Aligns generated selector with store and preserves explicit DB constraint naming intent | generated client + plan D1 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Fix-train evaluator route clarified by owner | significant | yes |

## Gate Results

All implementation gates are `NOT_RUN` until PLAN-EVAL passes.

## Handoff Notes

- PLAN-EVAL passed under the owner-authorized Opus 5 supervisor route. IMPL-EVAL must verify C1-C3.
