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
| 2026-08-01 | 1 | implementation | Correlation `name:` changed to `map:`; one selector constant now drives delegate, calls, and fake. |
| 2026-08-01 | 1 | C1 | Ungated test derived `sagaId_correlationKey` from the shipped fragment and passed. |
| 2026-08-01 | 1 | live runtime | Postgres 18.3 db push + Prisma 7.8 generate + required store round-trip passed: `1 passed, 0 failed`. |
| 2026-08-01 | 1 | reconcile | PR body records C2 deployed-index consequence and C3 latent transition selector; issue/PR scope unchanged. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| `name:` → `map:` for correlation only | Aligns generated selector with store and preserves explicit DB constraint naming intent | generated client + plan D1 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Fix-train evaluator route clarified by owner | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| scoped check | `run-deno-check.ts --root packages/plugin-sagas-core --root plugins/sagas --ext ts` | PASS | 178 files, 0 findings |
| scoped lint | `run-deno-lint.ts --root packages/plugin-sagas-core --root plugins/sagas --ext ts` | PASS | 178 files, 0 findings |
| scoped format | `run-deno-fmt.ts ... --ignore-line-endings` | PASS | 178 files, 0 findings |
| scoped tests | `deno test --allow-all packages/plugin-sagas-core/ plugins/sagas/` | PASS | Live test intentionally ignored without env; ungated schema guard passed |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| per-root doctrine | PASS | both requested `check-doctrine.ts` commands | zero FAIL; pre-existing warnings only |
| code quality | PASS | `deno task quality:gate` | scanner `ok:true`; arch checks zero FAIL |
| JSR audit | PASS with existing warnings | `audit-jsr-package.ts` for both roots | dry-run OK; no new public/export risk |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Prisma/Postgres round-trip | PASS | Postgres 18.3 on ephemeral port 42110; `1 passed, 0 failed` | Shipped fragment copied verbatim; db push and Prisma 7.8 generation shown in output |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Prisma 7.8 generated client | PASS | generated `SagaRuntimeCorrelationWhereUniqueInput` | exposes `sagaId_correlationKey`; sibling remains named selector |

## Handoff Notes

- PLAN-EVAL passed under the owner-authorized Opus 5 supervisor route. IMPL-EVAL should verify the
  selector constant/derived test, verbatim-fragment live wrapper, real terminal evidence, and C2/C3
  PR disclosures.
