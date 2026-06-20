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

S5 implementation is complete locally: the core telemetry seam and engine handle spans are wired, native runtime instrumentation reaches the engine, `plugins/sagas` has an OTel-backed saga tracer injected at native composition roots, and service publish trace headers are proven to parent `saga.handle` spans. S1-S4 are committed and pushed; S5 is ready to commit.

## Completed

- Read required AGENTS, harness, doctrine, PR, tools, Deno toolchain, JSR, archetype, service overlay, gate matrix, debt, research, plan, and plan-meta artifacts.
- Confirmed branch `feat/prime-time/sagas-telemetry-spans` tracks `origin/feat/prime-time/sagas-telemetry-spans`.
- Implemented S1 seam shape extension and focused telemetry seam test.
- Committed and pushed S1 (`eeff38c`), with PR #76 progress comment.
- Implemented S2 handle span lifecycle and tests.
- Committed and pushed S2 (`9d2e6d2`), with PR #76 progress comment.
- Implemented S3 runtime/bridge instrumentation threading and test.
- Committed and pushed S3 (`24828ad`), with PR #76 progress comment.
- Implemented S4 OTel adapter, composition-root injection, plugin import-map subpaths, and adapter tests.
- Committed and pushed S4 (`2c48496`), with PR #76 progress comment.
- Implemented S5 service publish trace-linkage and failure-path tests.
- Added missing package-local `@module` tags for existing `plugin-sagas-core` subpath barrels so JSR audit exits 0.
- Cleared scoped `plugins/sagas` doctrine FAIL by making `SagasCliCommand` a concrete protected-constructor base wrapper instead of an abstract class with no abstract members.

## In Progress

- S5 commit/push/PR comment and final PR readiness comment.

## Next Steps

1. Commit S5.
2. Append `commits.md`, push explicit refspec, and comment PR #76 with final readiness evidence.

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
| `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts` | changed | Threads native instrumentation into engine construction and bridge options. |
| `packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts` | changed | Accepts and holds bridge instrumentation for deferred cascade spans. |
| `packages/plugin-sagas-core/tests/telemetry/instrumentation_test.ts` | new | Proves parent context forwards into tracer options. |
| `packages/plugin-sagas-core/tests/telemetry/saga-engine-spans_test.ts` | new | Proves success and failure handle span lifecycle and duration metric. |
| `plugins/sagas/deno.json` | changed | Adds local import-map subpaths for core telemetry and telemetry tracer plus test assert dependency. |
| `plugins/sagas/src/telemetry/otel-saga-tracer.ts` | new | OTel-backed structural saga tracer adapter and instrumentation factory. |
| `plugins/sagas/services/src/main.ts` | changed | Injects `createSagaTelemetry()` into the service native runtime. |
| `plugins/sagas/src/runtime/saga-runner.ts` | changed | Supplies default native saga telemetry for the runner runtime options. |
| `plugins/sagas/src/runtime/saga-supervisor.ts` | changed | Supplies default native saga telemetry in the default runtime factory. |
| `plugins/sagas/tests/telemetry/otel-saga-tracer_test.ts` | new | Proves adapter mapping. |
| `plugins/sagas/tests/telemetry/publish-trace-linkage_test.ts` | new | Proves service publish trace linkage and failure-path ERROR spans. |
| `packages/plugin-sagas-core/src/{abstracts,contracts/v1,integration,presets,streams,telemetry,testing}/mod.ts` | changed | Adds missing `@module` tags for JSR audit. |
| `plugins/sagas/src/cli/commands.ts` | changed | Clears scoped doctrine A4 finding by removing inappropriate `abstract` keyword. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Final scoped check/lint/fmt on `packages/plugin-sagas-core` + `plugins/sagas` passed. |
| Fitness | PASS | Publish dry-run, doc lint, JSR audit, scoped doctrine checks, and manual F-gate evidence recorded. Root `arch:check` remains red on unrelated repo-wide debt. |
| Runtime | PASS | Final targeted telemetry/runtime tests passed: 21 passed, 0 failed. |
| Consumer | PASS | `plugins/sagas` scoped check/tests passed. |

## Open Questions

- Which in-memory OTel test helper is already available for S4/S5.

## Drift and Debt

- Drift: root `deno task arch:check` is not a usable slice verdict because it fails on pre-existing repo-wide findings; scoped doctrine checks are green.
- Debt: none created.

## Commits

- eeff38c: feat(sagas): extend telemetry span seam
- 9d2e6d2: feat(sagas): emit engine handle spans
- 24828ad: feat(sagas): thread runtime instrumentation
- 2c48496: feat(sagas): wire otel saga telemetry
- f51af82c: feat(sagas): verify publish trace linkage
