# Worklog: Emit and correlate saga cascade spans

## Run Metadata

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| Run ID         | `fix-saga-span-emission-and-correlation--0.0.7`                  |
| Branch         | `fix/saga-span-emission-and-correlation`                         |
| Archetype      | `3 - Runtime/Behavior`; `5 - Plugin Package` composition overlay |
| Scope overlays | runtime + telemetry + consumer proof                             |

## Design

### Public Surface

- Existing `@netscript/plugin-sagas-core/telemetry`: add `SagaAttributes.CORRELATION_ID`, common
  cascade context, and optional structural W3C span-context extraction; retain all six span
  factories.
- Existing `@netscript/plugin-sagas-core/runtime`: add optional instrumentation/context fields to
  compensator options/requests/results and engine results. Changes are additive; no subpath changes.
- Existing `@netscript/plugin-sagas/runtime`: no new symbol; the durable runtime factory only wires
  the core dependency into the default compensator.

### Domain Vocabulary

- `netscript.correlation.id` — cross-plane join key on every saga span.
- `netscript.saga.correlation_key` — saga instance lookup/correlation semantic retained alongside
  the cross-plane key.
- `SagaTraceParent` — serialized W3C traceparent/tracestate crossing ended or non-ambient runtime
  seams.
- Cascade outcomes — `success` for completed dispatch, `skipped` for no registered compensation
  handler, and `error` for thrown/unsupported paths.

### Ports

- `SagaTelemetrySpan` — exposes optional serialized W3C context in addition to lifecycle methods,
  modeled on streams-core's `spanContext()` precedent.
- `SagaInstrumentation` — owns span construction, shared saga/correlation attributes, finish
  behavior, and context extraction; runtime never imports OTel implementation types.
- `SagaCompensator` — receives injected `SagaInstrumentation` and owns the compensation operation
  span.

### Constants

- `SagaSpanNames` — retain `saga.handle`, `.send`, `.schedule`, `.spawn`, `.compensate`,
  `.complete`.
- `SagaAttributes` — add `CORRELATION_ID: 'netscript.correlation.id'`; retain `SAGA_CORRELATION_KEY`
  as a distinct field.
- `SagaTelemetryOutcomes` — reuse existing `success`, `skipped`, and `error`; add no vocabulary.

### Plugin Composition Axes

- Runtime axis: `plugins/sagas/src/runtime/create-durable-saga-runtime.ts` composes core
  `SagaCompensator`, `SagaRuntimeNativeOptions`, and the core instrumentation instance.
- Contracts/config/service/database/host-discovery axes: unchanged; the plugin neither defines nor
  redefines a telemetry contract.
- Sibling/core contracts consumed: imported from `@netscript/plugin-sagas-core/runtime`; none
  re-exported or redefined by this change.

### Commit Slices

| #  | Slice                          | Gate                                                  | Files                                        |
| -- | ------------------------------ | ----------------------------------------------------- | -------------------------------------------- |
| S1 | Research and locked plan       | Markdown format, diff, raw lock check                 | run-dir Markdown                             |
| S2 | Red-before proof               | targeted structured test exits 1 with recorded counts | new cascade telemetry test only              |
| S3 | Telemetry/W3C contract         | targeted check and telemetry tests                    | core telemetry, engine, telemetry tests      |
| S4 | Runtime emission/composition   | targeted core/plugin tests                            | bridge, compensator, composition files/tests |
| S5 | Docs and Flow-B consumer proof | docs delta + validator unit test                      | README and three Flow-B files                |
| S6 | Allowed readiness gates        | gate table; separate IMPL-EVAL next                   | no planned source change                     |

### Deferred Scope

- Successful child-saga spawn lifecycle — unsupported today; only its attempted dispatch error is
  traced.
- Nested compensation implementation — current error remains, now observable.
- Aspire-backed Flow-B execution — requires a coordinator-held runtime lease and is not authorized
  in this leaf.
- Shared generated assets — no regeneration; stop/report if a check finds staleness.

### Contributor Path

To add a new saga cascade kind, define its domain effect in core, add its canonical span/attributes
to core telemetry, dispatch it in the existing exhaustive bridge seam (or the operation-owning core
runtime), propagate explicit W3C/correlation context, cover success and failure outcomes with a
recording tracer, update the README, then extend the real Flow-B consumer assertion when it crosses
a process seam. A thin plugin may only wire the core primitive.

## Progress Log

| Time                 | Slice | Step                 | Notes                                                                                                                                                       |
| -------------------- | ----- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30T12:57:16Z | S1    | Re-baseline/research | Confirmed five zero-caller factories, compensation gap, explicit-parent need, plugin composition seam, writer-derived derivative cascade, and JSR baseline. |
| 2026-08-30T12:57:16Z | S1    | Design               | Locked all factory outcomes, correlation ownership, product path ceiling, slices, and gate expectations.                                                    |
| 2026-08-30T13:10:51Z | S1    | Supervisor review    | Added the fourth derivative gate from its writer, measured its clean baseline, and made the leased Flow-B runtime gate supervisor-only.                     |

## Decisions

| Decision                           | Reason                                                              | Source                                           |
| ---------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| Retain/emit all five cascade spans | Each represents a real operation or attempted unsupported dispatch. | issue #1368, bridge/compensator code, plan D1–D4 |
| Attribute set owns cross-plane key | Telemetry vocabulary stays out of runtime domain code.              | doctrine layering, plan D5–D6                    |
| Explicit W3C handoff               | Handle span ends before bridge dispatch.                            | engine code, streams-core precedent, plan D7     |
| Compensator owns compensation span | Covers direct/missing/nested/error paths and actual cascade size.   | runtime ownership doctrine, plan D3–D4           |
| Plugin change is wiring only       | Core owns the convention; plugin composes it.                       | Archetype 5 thinness law                         |

## Drift

| Drift                                                                                 | Severity    | Logged in drift.md |
| ------------------------------------------------------------------------------------- | ----------- | ------------------ |
| Owner-locked baseline differs from newly advanced local `origin/main`                 | minor       | yes                |
| Owner-assigned Codex S1 route differs from generic deep-research route                | minor       | yes                |
| RTK executable absent despite repo preference                                         | minor       | yes                |
| Initial S1 plan omitted the MCP export corpus gate and over-assigned the runtime gate | significant | yes                |

## Gate Results

### Static Gates

| Gate                     | Command or check                                      | Result | Notes                                                                                       |
| ------------------------ | ----------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| Baseline publish dry-run | package `publish:dry-run`                             | PASS   | exit 0, 111 files                                                                           |
| Baseline doc lint        | root `doc:lint`                                       | FAIL   | measured existing nine private-type findings, zero missing JSDoc; plan requires no increase |
| S1 artifact/lock checks  | `deno fmt --check`, `git diff --check`, raw lock diff | PASS   | Six artifacts formatted; diff checks exit 0; `deno.lock` unchanged                          |

### Fitness Gates

| Gate                   | Result         | Evidence                      | Notes                                                           |
| ---------------------- | -------------- | ----------------------------- | --------------------------------------------------------------- |
| F-5/F-7 baseline audit | PASS           | `audit-jsr-package.ts` exit 0 | Existing root-cardinality and broad slow-type warnings recorded |
| Remaining fitness set  | PENDING_SCRIPT | plan gate table               | Run only after PLAN-EVAL/S2 implementation authorization        |

### Runtime Gates

| Gate                    | Result  | Evidence        | Notes                                                                                               |
| ----------------------- | ------- | --------------- | --------------------------------------------------------------------------------------------------- |
| Flow-B consumer runtime | NOT_RUN | author boundary | REQUIRED supervisor-coordinated acceptance gate; author-must-not-run without the cluster-wide lease |

### Consumer Gates

| Consumer                      | Result  | Evidence                                   | Notes                                                                                            |
| ----------------------------- | ------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Published core/plugin surface | NOT_RUN | plan gate table                            | Additive surface planned; dry-run after implementation                                           |
| MCP export corpus baseline    | PASS    | `deno task check:mcp-export-corpus` exit 0 | Non-mutating check: 35 packages, 270 subpaths, 7,614 symbols                                     |
| Generated derivatives         | NOT_RUN | four writers inspected                     | MCP corpus is expected to go stale; all stale results are stop/report, never author regeneration |

## Handoff Notes

- PLAN-EVAL should inspect D1–D10, especially explicit trace handoff, the unsupported spawn error
  span, the expected MCP corpus movement, and the supervisor-only Flow-B runtime acceptance gate.
- S2 must be a failing-test-only commit. Do not edit product source until its raw nonzero exit and
  exact counts are recorded against the locked baseline.
