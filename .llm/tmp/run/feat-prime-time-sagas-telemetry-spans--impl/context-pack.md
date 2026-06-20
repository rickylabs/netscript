# Context Pack: sagas-telemetry-spans

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-prime-time-sagas-telemetry-spans--impl` |
| Branch | `feat/prime-time/sagas-telemetry-spans` |
| Current phase | `implement` |
| Archetype | `ARCHETYPE-3-runtime-behavior` |
| Scope overlays | `SCOPE-service` |

## Current State

S2 implementation is complete locally: the core telemetry seam accepts parent trace context, `SagaEngineOptions` accepts optional instrumentation with a NOOP default, and `SagaEngine.#handleEntry` emits `saga.handle` spans around handler + persistence. S1 is committed and pushed; S2 is ready to commit.

## Completed

- Read required AGENTS, harness, doctrine, PR, tools, Deno toolchain, JSR, archetype, service overlay, gate matrix, debt, research, plan, and plan-meta artifacts.
- Confirmed branch `feat/prime-time/sagas-telemetry-spans` tracks `origin/feat/prime-time/sagas-telemetry-spans`.
- Implemented S1 seam shape extension and focused telemetry seam test.
- Committed and pushed S1 (`eeff38c`), with PR #76 progress comment.
- Implemented S2 handle span lifecycle and tests.

## In Progress

- S2 commit/push/PR comment.

## Next Steps

1. Commit S2.
2. Append `commits.md`, push explicit refspec, and comment PR #76.
3. Start S3 instrumentation threading through bridge/runtime composition.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Structural seam remains in `plugin-sagas-core`; OTel adapter lives in `plugins/sagas` | `plan.md` | Prevents core package from depending on telemetry/OTel. |
| `SagaEngine` owns `saga.handle` span lifecycle | `plan.md` | One span per handled message and saga instance. |
| NOOP default instrumentation | `plan.md` | Behavior-preserving for library default usage. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/tmp/run/feat-prime-time-sagas-telemetry-spans--impl/*` | new | Implementation artifacts. |
| `packages/plugin-sagas-core/src/telemetry/instrumentation.ts` | changed | Adds `SagaTraceParent`, tracer parent option, and start-handle forwarding. |
| `packages/plugin-sagas-core/src/telemetry/mod.ts` | changed | Exports `SagaTraceParent`. |
| `packages/plugin-sagas-core/src/runtime/saga-engine.ts` | changed | Adds optional engine instrumentation field with NOOP default. |
| `packages/plugin-sagas-core/tests/telemetry/instrumentation_test.ts` | new | Proves parent context forwards into tracer options. |
| `packages/plugin-sagas-core/tests/telemetry/saga-engine-spans_test.ts` | new | Proves success and failure handle span lifecycle and duration metric. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | S2 PASS | check/lint/fmt scoped to `packages/plugin-sagas-core` passed. |
| Fitness | IN_PROGRESS | S1/S2 public-surface/runtime invariants covered by tests; full manual evidence pending final gate pass. |
| Runtime | S2 PASS | telemetry seam and engine span tests passed; existing runtime tests passed. |
| Consumer | NOT_RUN | pending |

## Open Questions

- Which in-memory OTel test helper is already available for S4/S5.

## Drift and Debt

- Drift: none.
- Debt: none created.

## Commits

- eeff38c: feat(sagas): extend telemetry span seam
