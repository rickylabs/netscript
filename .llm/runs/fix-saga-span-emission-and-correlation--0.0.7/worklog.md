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
  compensator options plus explicit correlation/context fields to requests/results and engine
  results. Published structural signatures move; no export-map key or subpath changes.
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
  span. The bridge supplies the normalized instrumentation plus engine-selected execution context
  per call so a baseline-compatible `new SagaCompensator({ clock })` remains observable in the
  composed runtime.

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
- Direct `SagaEngine.dispatchCascaded()` use as a public bus — the production composition root
  routes through the bridge, while this compatibility path has no originating handle context.

### Contributor Path

To add a new saga cascade kind, define its domain effect in core, add its canonical span/attributes
to core telemetry, dispatch it in the existing exhaustive bridge seam (or the operation-owning core
runtime), propagate explicit W3C/correlation context, cover success and failure outcomes with a
recording tracer, update the README, then extend the real Flow-B consumer assertion when it crosses
a process seam. A thin plugin may only wire the core primitive.

## Progress Log

| Time                 | Slice | Step                     | Notes                                                                                                                                                                                                                                       |
| -------------------- | ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30T12:57:16Z | S1    | Re-baseline/research     | Confirmed five zero-caller factories, compensation gap, explicit-parent need, plugin composition seam, writer-derived derivative cascade, and JSR baseline.                                                                                 |
| 2026-08-30T12:57:16Z | S1    | Design                   | Locked all factory outcomes, correlation ownership, product path ceiling, slices, and gate expectations.                                                                                                                                    |
| 2026-08-30T13:10:51Z | S1    | Supervisor review        | Added the fourth derivative gate from its writer, measured its clean baseline, and made the leased Flow-B runtime gate supervisor-only.                                                                                                     |
| 2026-08-30T13:37:34Z | S1    | PLAN-EVAL cycle 1        | Read verdict `7b96c498`; corrected complete ownership, assertion-only S2 red contract, correlation precedence/transport, direct-engine non-scope, and README gate.                                                                          |
| 2026-08-30T13:53:27Z | S1    | PLAN-EVAL cycle 2        | Verdict `PASS_PLAN` at evaluator commit `81c5f874`; plan gate cleared with implementation notes recorded below.                                                                                                                             |
| 2026-08-30T13:53:27Z | S2    | Red-before proof         | Commit `2146443c`; structured wrapper raw exit 1, 0 passed / 2 failed, both assertion failures against unchanged product code.                                                                                                              |
| 2026-08-30T14:03:38Z | S3    | Telemetry/W3C contract   | Added the canonical cross-plane attribute, typed cascade context, structural W3C extraction, and engine-selected correlation/context transport. Kept production factory callers out of this slice for S4.                                   |
| 2026-08-30T14:14:44Z | S4    | Runtime emission         | Added all five operation-owned callers, normalized one instrumentation dependency through core/plugin composition, and preserved engine-selected correlation/direct-parent context through compensation cascades.                           |
| 2026-08-30T14:23:57Z | S5    | Docs/consumer proof      | Documented all six span contracts and added a generated Flow-B compensation fixture plus validator checks for direct parenting and exact callback/payload correlation equality. Runtime execution remains supervisor-only.                  |
| 2026-08-30T14:28:11Z | S6    | Merge-readiness evidence | Re-ran all allowed exact-head gates. Static, architecture, publish, focused tests, quality, and three check-only derivative gates pass; MCP corpus is the expected attributed STOP; two unrelated baseline gates remain measured negatives. |
| 2026-08-30T14:40:34Z | S7    | IMPL-EVAL repair red     | Cycle-1 F2/F3 regression tests compile and fail only by assertion: raw exit 1, 10 passed / 2 failed. Scheduled dispatch overwrites `handler-chosen` with `upstream-42`; noop compensation drops the handled message traceparent.            |
| 2026-08-30T14:44:02Z | S7    | IMPL-EVAL repair green   | Child-key precedence and legacy handler trace context repaired. Focused 12/12, targeted 27/27, whole core 84/0/3 ignored, plugin 7/7; static/quality/publish/derivative gates match plan and MCP remains the attributed STOP.               |

## Decisions

| Decision                                                      | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                | Source                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Retain/emit all five cascade spans                            | Complete measures the engine's persisted completion transition; the other four measure real bridge/compensator work or rejection.                                                                                                                                                                                                                                                                                                     | issue #1368, PLAN-EVAL F1, plan D1–D4/D9     |
| Attribute set owns cross-plane key                            | Telemetry vocabulary stays out of runtime domain code.                                                                                                                                                                                                                                                                                                                                                                                | doctrine layering, plan D5–D6                |
| Lock two correlation precedences                              | Publisher key wins for cross-plane ID; definition rule wins for saga key; downstream spans consume both engine-selected values.                                                                                                                                                                                                                                                                                                       | PLAN-EVAL F3, plan D6–D8                     |
| Explicit W3C handoff                                          | Handle span ends before bridge dispatch.                                                                                                                                                                                                                                                                                                                                                                                              | engine code, streams-core precedent, plan D7 |
| Compensator owns compensation span                            | Covers direct/missing/nested/error paths and actual cascade size.                                                                                                                                                                                                                                                                                                                                                                     | runtime ownership doctrine, plan D3–D4       |
| Plugin change is wiring only                                  | Core owns the convention; plugin composes it.                                                                                                                                                                                                                                                                                                                                                                                         | Archetype 5 thinness law                     |
| Compensation request fields are optional with no fallback     | `correlationId`, `correlationKey`, and parent context remain optional for source compatibility. The composed bridge always supplies engine-selected values. When absent on a direct/external request, the compensator does not derive them from the message, definition rule, or default; telemetry leaves them absent, and a registered handler requiring a missing saga key fails validation rather than receiving an invented key. | PLAN-EVAL cycle 2 F3b                        |
| Compensation cascade size is recorded through instrumentation | Start the compensate span before handler execution with no size, then call a typed `SagaInstrumentation` recorder after the handler returns. Runtime code never calls raw `setAttribute`, and handler duration remains measured.                                                                                                                                                                                                      | PLAN-EVAL cycle 2 F3 minor, plan D3/D5       |
| Complete span reports transition truth, not saga success      | Emit whenever engine `completed` is true even without a store. Record the resolved persisted status exactly; mixed terminal cascades may produce `failed` or `compensating`. Span presence only says a complete effect participated in resolution.                                                                                                                                                                                    | PLAN-EVAL cycle 2 F1 residual                |
| Preserve explicit child domain keys                           | Scheduled messages keep a handler-supplied `correlationKey`; the upstream correlation ID is only the fallback. `send()` has no child-key surface, so its nested message intentionally uses the upstream ID and a downstream correlate rule remains authoritative.                                                                                                                                                                     | IMPL-EVAL cycle 1 F2, plan D8                |
| Preserve legacy handler trace context without span fallback   | Compensation span parenting still uses only the supplied engine context. If noop instrumentation yields no new span context, the handler retains the handled message's existing traceparent/tracestate; this does not recompute correlation or parent a telemetry span.                                                                                                                                                               | IMPL-EVAL cycle 1 F3                         |

## Drift

| Drift                                                                                  | Severity    | Logged in drift.md |
| -------------------------------------------------------------------------------------- | ----------- | ------------------ |
| Owner-locked baseline differs from newly advanced local `origin/main`                  | minor       | yes                |
| Owner-assigned Codex S1 route differs from generic deep-research route                 | minor       | yes                |
| RTK executable absent despite repo preference                                          | minor       | yes                |
| Initial S1 plan omitted the MCP export corpus gate and over-assigned the runtime gate  | significant | yes                |
| PLAN-EVAL found no-op complete ownership and an invalid mechanical red-before contract | significant | yes                |
| Release surface baseline and docs export counts sit outside the product ceiling        | minor       | yes                |
| Global README task reports unchanged out-of-ceiling bench README debt                  | minor       | yes                |
| Plugin JSR audit reports unchanged out-of-ceiling doctor module-tag debt               | minor       | yes                |

## Gate Results

### Static Gates

| Gate                     | Command or check                                       | Result | Notes                                                                                       |
| ------------------------ | ------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------- |
| Baseline publish dry-run | package `publish:dry-run`                              | PASS   | exit 0, 111 files                                                                           |
| Baseline doc lint        | root `doc:lint`                                        | FAIL   | measured existing nine private-type findings, zero missing JSDoc; plan requires no increase |
| S1 artifact/lock checks  | `deno fmt --check`, `git diff --check`, raw lock diff  | PASS   | Six artifacts formatted; diff checks exit 0; `deno.lock` unchanged                          |
| PLAN-EVAL cycle 2        | separate evaluator verdict `81c5f874`                  | PASS   | `PASS_PLAN`; implementation authorized                                                      |
| S2 measured negative     | structured test wrapper                                | PASS   | raw exit 1; 0 passed / 2 failed; both failures are assertions; test-only commit `2146443c`  |
| S3 core check            | structured check wrapper, package root                 | PASS   | exit 0; 112 selected modules, zero findings                                                 |
| S3 telemetry tests       | structured test wrapper, three focused suites          | PASS   | exit 0; 7 passed / 0 failed                                                                 |
| S3 package format/lint   | structured format and lint wrappers, package root      | PASS   | exit 0; 112 files processed by each, zero findings                                          |
| S4 core/plugin checks    | structured check wrappers, core and plugin roots       | PASS   | exit 0; 112 core and 84 plugin modules, zero findings                                       |
| S4 targeted tests        | structured test wrapper, locked core/plugin targets    | PASS   | exit 0; 31 passed / 0 failed                                                                |
| S4 core/plugin fmt/lint  | structured format/lint wrappers, core and plugin roots | PASS   | exit 0; 112 core and 84 plugin files, zero findings                                         |
| S5 Flow-B check/test     | focused structured wrappers                            | PASS   | 3 files checked/linted/formatted; validator 5 passed / 0 failed                             |
| S5 focused README        | README standard checker, package path                  | PASS   | exit 0; in-scope README 1/1 conformant                                                      |
| Global README baseline   | `deno task docs:readme:check`                          | FAIL   | exit 1; only `packages/bench/README.md`, unchanged and outside ceiling                      |
| Post-change doc lint     | package doc-lint wrapper                               | FAIL   | expected baseline: 9 private-type findings, 0 missing JSDoc/other                           |
| S6 exact-head checks     | structured core/plugin check wrappers                  | PASS   | 112 core and 84 plugin modules; zero findings                                               |
| S6 exact-head tests      | structured locked-target test wrapper                  | PASS   | 36 passed / 0 failed                                                                        |
| S6 exact-head fmt/lint   | structured core/plugin wrappers                        | PASS   | 112 core and 84 plugin files; zero findings                                                 |
| Architecture/quality     | `arch:check`, `quality:gate`                           | PASS   | exit 0; repository-wide warnings only                                                       |
| Core/plugin publish      | package publish dry-runs                               | PASS   | both exit 0                                                                                 |

### Fitness Gates

| Gate                   | Result | Evidence                      | Notes                                                           |
| ---------------------- | ------ | ----------------------------- | --------------------------------------------------------------- |
| F-5/F-7 baseline audit | PASS   | `audit-jsr-package.ts` exit 0 | Existing root-cardinality and broad slow-type warnings recorded |
| Core JSR audit         | PASS   | exact-head package audit      | exit 0; same two recorded warnings                              |
| Plugin JSR audit       | FAIL   | exact-head plugin audit       | inherited `doctor.ts` module-tag finding; outside ceiling       |
| Remaining fitness set  | PASS   | S6 gate table                 | architecture, quality, publish, static and consumer-unit gates  |

### Runtime Gates

| Gate                    | Result  | Evidence        | Notes                                                                                               |
| ----------------------- | ------- | --------------- | --------------------------------------------------------------------------------------------------- |
| Flow-B consumer runtime | NOT_RUN | author boundary | REQUIRED supervisor-coordinated acceptance gate; author-must-not-run without the cluster-wide lease |

### Consumer Gates

| Consumer                      | Result | Evidence                       | Notes                                                                    |
| ----------------------------- | ------ | ------------------------------ | ------------------------------------------------------------------------ |
| Published core/plugin surface | PASS   | both publish dry-runs exit 0   | Additive existing-signature evolution; no export-map key change          |
| MCP export corpus             | STOP   | exact-head check exits 1       | leaf-caused signature staleness; supervisor-sequenced, never regenerated |
| Agent docs prose              | PASS   | check-only task exit 0         | no shared asset change                                                   |
| Publish assets                | PASS   | check-only task exit 0         | no shared asset change                                                   |
| CLI assets barrel             | PASS   | direct writer `--check` exit 0 | locked non-mutating invocation; no shared asset change                   |

## Handoff Notes

- PLAN-EVAL is cleared. S2 compiled against the locked surface and failed exactly at the two
  required assertions; product implementation may proceed in slice order.
- S3 supplies the typed telemetry/context contract and S4 now supplies all five production owners.
  Compensation request fields remain optional, absent values are never derived, and post-handler
  cascade size is recorded only through the typed instrumentation method.
- S5 is implemented and statically green. The global README task's unrelated bench-package debt is
  measured in `drift.md`; the focused in-scope README check passes.
- S6 runs the allowed merge-readiness/static derivative gates. The expected MCP corpus stale result
  is stop/report, and the required Flow-B runtime remains supervisor-owned/author-must-not-run.
- S6 is complete. All allowed author-owned proof is green except the two measured inherited
  negatives (global bench README and plugin doctor module tag). MCP corpus staleness is the expected
  attributed `STOP`, not a failure to regenerate.
- The branch needs a refreshed supervisor/evaluator pass over S5/S6 because the recorded Tier-A
  sign-off at `7517ae50` predates the consumer-proof slice.
- The expected MCP corpus and release public-surface baseline staleness are supervisor sequencing
  handoffs. Do not regenerate them. Flow-B runtime remains author-must-not-run.

## Supervisor Tier-A sign-off — `7517ae50`

Reviewer is the fixes topic supervisor: not the author, not either plan evaluator. Every check was
re-derived independently.

**Tier-A PASSES.** A fresh, separate, opposite-family IMPL-EVAL is still mandatory, and one gate is
a deliberate stop-and-report rather than a pass (below).

### The red-before flipped, and it flipped honestly

| Head                                       | Focused `saga-cascade-spans_test.ts`                    |
| ------------------------------------------ | ------------------------------------------------------- |
| `2146443c` (red-before, no product change) | exit 1 · **0 passed / 2 failed**, both `AssertionError` |
| `7517ae50` (product landed)                | exit 0 · **9 passed / 0 failed**                        |

The test grew from 2 cases to 9, so the important question is whether the original red was weakened.
It was not: both original case names survive **verbatim** — _"Saga runtime emits a compensation
cascade span"_ and _"Saga handle span carries the cross-plane correlation id"_ — along with their
assertions (`expected saga.cascade.compensate to be started`, and the `order-42` correlation value).

The seven added cases are the conditions made executable rather than merely recorded:

- _"SagaCompensator records missing handlers as skipped **without deriving correlation**"_ — F3b's
  no-fallback rule
- _"SagaCompensator rejects a registered handler when **engine correlation context is absent**"_ —
  F3b
- _"compensation and returned cascades **consume engine-selected** correlation and parents"_ — D8
- _"bridge records **send failures** at the downstream operation"_ — F4's uninstrumented `send`
- plus scheduled-persistence, unsupported-spawn, and thrown/nested-deferred compensation cases

### Exact-head gates at `7517ae50`

| Gate                                                                           | Result                                                                |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Head identity                                                                  | local == `origin` == PR #1764 `headRefOid`; tree clean                |
| Ceiling containment                                                            | **13 changed product paths, all inside the locked 19** — none outside |
| `deno.lock`                                                                    | byte-unchanged vs `f8b4f804`                                          |
| Focused cascade-spans suite                                                    | exit 0 · 9 passed / 0 failed                                          |
| Whole `packages/plugin-sagas-core`                                             | exit 0 · **81 passed / 0 failed / 3 ignored**                         |
| Plugin targeted (`create-durable-saga-runtime_test.ts`)                        | exit 0 · 7 passed / 0 failed                                          |
| Scoped type check                                                              | exit 0                                                                |
| Scoped lint (root rules)                                                       | exit 0 · 11 files                                                     |
| Scoped fmt                                                                     | no findings                                                           |
| `check:agent-docs-prose` / assets-barrel (check-only) / `check:publish-assets` | all exit 0                                                            |
| `quality:gate`                                                                 | two pre-existing `export default` WARNs, outside the ceiling          |

**A supervisor error corrected in place.** The first ceiling check flagged
`plugins/sagas/src/runtime/create-durable-saga-runtime{,_test}.ts` as violations. They are **not** —
they are items 8 and 15 of the locked ceiling, and the plan's Target line reads
"`packages/plugin-sagas-core`, thin `plugins/sagas` wiring". The gate runner's pattern was too
narrow; re-checked against the plan's actual 19-path list, containment is clean.

### `check:mcp-export-corpus` — stop-and-report, and it is genuinely leaf-caused

The gate is **NONZERO** at this head. Attributed rather than assumed: the same command in a pristine
worktree at base `f8b4f804` exits **0**, so the staleness is **caused by this leaf**, not inherited
from a stale base.

The plan predicted exactly this (gate 16: _"expect nonzero stale-corpus result; stop/report for
supervisor sequencing and do not regenerate"_), and the author correctly **did not regenerate**. No
new exported symbol was added — the corpus moves because of **signature** changes to existing
exports, consistent with D8's explicit request/result signature change.

Regeneration stays owner-sequenced while the shared-asset sequence is live. This is recorded as a
**deliberate stop, not a pass and not a waiver.**

### Conditions carried from PLAN-EVAL cycle 2

Both are recorded in the worklog and made executable in tests: **F3b** (optional fields, and the
compensator applying **no fallback precedence** when they are absent) and **F1 residual**
(`saga.cascade.complete` emits whenever `completed` is true regardless of store presence, carrying
the **persisted** status, which may be `failed`/`compensating`).

### Not done here

No readiness flip, merge, relabel, issue edit, or acceptance-box tick. Gate 18 (Flow-B consumer
runtime) remains REQUIRED, supervisor-coordinated, **author-must-not-run** — recorded `NOT_RUN` as
boundary compliance, not as a pass.

## IMPL-EVAL cycle 1 repair

Cycle 1 evaluated the supervisor sign-off at `456e5590`, before S5/S6 landed. Its missing-slice F1
is superseded by `8d3317a3` and `ff161a44`; its measured bridge-precedence F2 and handler-trace F3
were reproduced at repair-red commit `bd89e523` and fixed in S7.

| Gate                                            | Repair result                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Focused `saga-cascade-spans_test.ts`            | exit 0 · **12 passed / 0 failed**                                                           |
| Targeted telemetry + two runtime contract files | exit 0 · **27 passed / 0 failed**                                                           |
| Whole `packages/plugin-sagas-core`              | exit 0 · **84 passed / 0 failed / 3 ignored**                                               |
| Plugin targeted runtime                         | exit 0 · **7 passed / 0 failed**                                                            |
| Core structured check / fmt / lint              | exit 0 · 112 selected · no findings                                                         |
| `quality:gate` / `arch:check`                   | exit 0 · no new findings                                                                    |
| Core/plugin publish dry-runs                    | exit 0 / exit 0                                                                             |
| Core doc lint                                   | baseline exit 1 · 9 private-type · 0 missing-JSDoc · 0 other                                |
| Core/plugin JSR audit                           | core exit 0; plugin baseline exit 1 only on unchanged out-of-ceiling `doctor.ts` module tag |
| Agent docs / publish assets / barrel check-only | exit 0 / exit 0 / exit 0                                                                    |
| MCP export corpus                               | expected exit 1 stale STOP; **not regenerated**                                             |
| README                                          | in-scope 1/1 conformant; global baseline exit 1 only on out-of-ceiling `packages/bench`     |
| Flow-B validator unit                           | exit 0 · **5 passed / 0 failed**                                                            |
| Flow-B consumer runtime                         | `NOT_RUN` · REQUIRED supervisor-owned lease gate                                            |
| Raw lock/shared generated/ceiling checks        | exit 0 · lock unchanged; no shared generated diff; repair paths inside ceiling              |

The repaired precedence is explicit: a scheduled child's supplied domain key wins, while the
upstream correlation ID remains its fallback. `send()` has no child-key option in the published DSL,
so its nested message intentionally receives the upstream ID; this is documented and tested. The
compensator's message trace fallback affects only the handler context under noop instrumentation—it
does not parent a span or derive correlation.
