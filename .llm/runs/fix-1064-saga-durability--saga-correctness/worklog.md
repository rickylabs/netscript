# Worklog: saga engine correctness

## Run Metadata

| Field          | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Run ID         | `fix-1064-saga-durability--saga-correctness`            |
| Branch         | `fix/1064-saga-durability`                              |
| Archetype      | `2 - Integration`, `3 - Runtime/Behavior`, `5 - Plugin` |
| Scope overlays | `docs`                                                  |

## Design

### Public Surface

- Preserve `KvStore.atomic`, `SagaEngine`, `SagaBusBridge`, and `createDurableSagaRuntime`
  signatures and exports.
- No new exported symbol is planned.

### Domain Vocabulary

- `atomic compare-and-set` — exactly one matching expected-version transaction may commit.
- `cascade ledger` — ordered effects returned by a saga or compensation handler.
- `correlation extractor` — definition-owned function selecting workflow identity from a message.
- `instance key` — saga id plus resolved correlation key; never transport message id.

### Ports

- `KvStore` — portable atomic persistence contract; Redis mechanics remain behind it.
- `SagaClockPort` — existing time source used by `SagaCompensator`.
- `SagaCompensatorPort` — existing cascade compensation boundary.

### Constants

- `CASCADED_MESSAGE_KINDS` — exhaustive supported effect vocabulary; `spawn` stays explicitly
  unsupported.

### Commit Slices

| # | Slice                                                        | Gate                                                                           | Files                                                                 |
| - | ------------------------------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 1 | #1064 Redis atomic contract and real-adapter regression      | owned Redis targeted test + KV/saga-store checks, lint, fmt                    | Redis adapter/connection internals, KV real-Redis test, run artifacts |
| 2 | #1065 default compensation dispatch and loud unknown effects | default-runtime compensation tests + saga-core/plugin gates and docs agreement | saga bridge/runtime factory tests and implementation; two saga docs   |
| 3 | #1066 extractor-first instance identity                      | concurrent two-workflow and same-key/different-id tests + saga-core/docs gates | saga engine tests/implementation; capability docs                     |
| 4 | Merge-readiness evidence                                     | aggregate check/tests/quality/arch/JSR/docs gates + IMPL-EVAL                  | run artifacts and PR metadata only                                    |

### Deferred Scope

- #1013/#1015 and general adapter audit — separate slices.
- Spawn dispatch — remains unsupported.
- Scaffold/registry wiring — concurrent slice ownership.

### Contributor Path

Add runtime behavior through the existing port/composition boundaries, place focused regressions
beside their package tests, then prove real infrastructure behavior with the environment-gated Redis
integration test.

## Progress Log

| Time       | Slice     | Step      | Notes                                                                                          |
| ---------- | --------- | --------- | ---------------------------------------------------------------------------------------------- |
| 2026-08-03 | plan      | diagnosis | Redis/Garnet direct paths completed; Redis concurrent CAS admitted 16/16 writers.              |
| 2026-08-03 | plan      | diagnosis | Default runtime dropped compensation; correlation failed in both collapse and fork directions. |
| 2026-08-03 | plan      | design    | Locked three defect slices plus merge-readiness slice; awaiting PLAN-EVAL.                     |
| 2026-08-03 | plan-eval | blocked   | Canonical local Qwen route returned `auth_required`; no evaluator session launched.            |
| 2026-08-03 | plan-eval | waived    | PR-A supervisor supplied a written opposite-family Plan-Gate waiver.                           |
| 2026-08-03 | slice 1   | implement | Bounded Redis connection failure and serialized connection-scoped atomic sections.             |
| 2026-08-03 | slice 1   | gate      | Real Redis list/save/CAS passed; package suites passed 79 + 63 tests.                          |
| 2026-08-03 | slice 2   | implement | Publish ledgers dispatch; durable runtime wires compensation; incomplete effects throw.        |
| 2026-08-03 | slice 2   | gate      | Default compensation and nested cascade passed; package suites passed 64 + 40 tests.           |

## Decisions

| Decision                                                          | Reason                                                    | Source                  |
| ----------------------------------------------------------------- | --------------------------------------------------------- | ----------------------- |
| Repair connection-scoped atomicity without port changes           | Real CAS reproduction isolates adapter contract drift     | research/Redis evidence |
| Dispatch returned effect ledgers and compose existing compensator | Effects are named data and plugin is the composition root | doctrine/code           |
| Extractor → explicit key → type default; ignore message id        | Definition semantics and #1066 acceptance                 | issue/code              |

## Drift

| Drift                                                                                          | Severity    | Logged in drift.md |
| ---------------------------------------------------------------------------------------------- | ----------- | ------------------ |
| Healthy Redis did not reproduce the field hang; dead-endpoint bounded failure remains required | significant | yes                |
| Capability path is a redirect stub to the canonical content page                               | minor       | yes                |

## Gate Results

### Static Gates

| Gate             | Command or check                                          | Result | Notes                                                   |
| ---------------- | --------------------------------------------------------- | ------ | ------------------------------------------------------- |
| Plan static scan | `deno doc --unstable-kv` on KV and saga-core entry points | PASS   | Existing public surfaces resolve; no expansion planned. |

### Fitness Gates

| Gate                | Result  | Evidence                                             | Notes                                                      |
| ------------------- | ------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Plan-Gate           | NOT_RUN | local Qwen provider canary blocked (`auth_required`) | Implementation blocked until PASS or written owner waiver. |
| #1064 scoped check  | PASS    | 139 files, 0 diagnostics                             | KV and saga-core wrapper.                                  |
| #1064 scoped lint   | PASS    | 139 files, 0 findings                                | No ignored diagnostics.                                    |
| #1064 scoped format | PASS    | 139 files, 0 findings                                | Source TypeScript only.                                    |
| `quality:scan`      | PASS    | `ok:true`, no findings                               | Existing allowance count 7.                                |
| `arch:check`        | PASS    | all doctrine roots `FAIL=0`                          | Existing warnings only.                                    |

### Runtime Gates

| Gate                    | Result | Evidence                           | Notes                                                      |
| ----------------------- | ------ | ---------------------------------- | ---------------------------------------------------------- |
| Pre-fix real Redis CAS  | FAIL   | 16 fulfilled, 0 rejected           | Expected diagnostic failure confirms #1064 contract drift. |
| Pre-fix compensation    | FAIL   | 0 compensation calls               | Expected diagnostic failure confirms #1065.                |
| Pre-fix correlation     | FAIL   | shared instance / per-message fork | Expected diagnostic failures confirm #1066.                |
| #1064 real Redis        | PASS   | 4 passed, 0 failed                 | List/save bounded; exactly 1/16 CAS winner.                |
| KV package suite        | PASS   | 79 passed, 0 failed                | Real test separately executed with owned Redis URL.        |
| Saga-core package suite | PASS   | 63 passed, 0 failed                | Real test separately executed with owned Redis URL.        |
| #1065 focused           | PASS   | 12 passed, 0 failed                | Default compensation, nested send, and loud failures.      |
| Saga-core #1065 suite   | PASS   | 64 passed, 0 failed                | Two unrelated integration tests ignored.                   |
| Sagas plugin suite      | PASS   | 40 passed, 0 failed                | Default durable runtime path exercised.                    |
| #1065 scoped wrappers   | PASS   | 186 files, 0 diagnostics/findings  | Check, lint, and source format clean.                      |

### Consumer Gates

| Consumer | Result | Evidence                        | Notes                                  |
| -------- | ------ | ------------------------------- | -------------------------------------- |
| Docs     | PASS   | 98 docs, 0 broken links/anchors | Capability content and tutorial agree. |

## Handoff Notes

- PLAN-EVAL should first challenge D1 (serialized Redis atomic sequence), D4 (private default
  clock), and D6 (default correlation key form), then confirm every acceptance clause has a proving
  test.
