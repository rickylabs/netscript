# Context Pack: Emit and correlate saga cascade spans

## Run Metadata

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| Run ID         | `fix-saga-span-emission-and-correlation--0.0.7`                  |
| Branch         | `fix/saga-span-emission-and-correlation`                         |
| Current phase  | `gate` — cycle-1 repair complete; refreshed Tier-A/eval pending  |
| Archetype      | `3 - Runtime/Behavior`; `5 - Plugin Package` composition overlay |
| Scope overlays | runtime + telemetry + consumer proof                             |

## Current State

S1 has re-derived the defect at locked baseline `f8b4f804`, resolved the design questions, and
locked a 19-path product ceiling plus a four-writer derivative gate table. Supervisor review added
the missing MCP export-corpus check and made the leased Flow-B runtime proof explicitly
supervisor-coordinated/author-must-not-run. PLAN-EVAL cycle 2 returned `PASS_PLAN` at evaluator
commit `81c5f874`. S2 then landed as the isolated test-only commit `2146443c`: the
baseline-compatible test compiled and produced raw exit 1 with 0 passed / 2 failed, both at the
required assertions. S3 added the typed telemetry/W3C contract and engine-selected correlation
transport. S4 now emits all five cascade spans at their operation owners and normalizes one
instrumentation instance through core/plugin composition. The locked S4 check/format/lint gates are
clean and its focused suite passes 31/31. S5 documents the contract and adds the real generated
Flow-B compensation fixture plus direct-parent/correlation validator proof; its focused static and
5-test gates pass. S6 exact-head evidence is complete: allowed static, architecture, quality,
publish, tests, and three non-mutating derivative gates pass; MCP corpus staleness is the expected
attributed STOP and was not regenerated. IMPL-EVAL cycle 1 ran against a pre-S5/S6 head, but its
live F2/F3 regressions were reproduced by assertions at `bd89e523`; S7 preserves explicit scheduled
child keys and legacy compensation-handler message trace context, with the full allowed gate set
green at the repaired tree.

## Completed

- Read harness, doctrine, tools, PR, RTK, JSR-audit, Archetype 3, and Archetype 5 authorities.
- Confirmed all five cascade span factories have zero production callers.
- Chose truthful emission for all five: complete surrounds the engine's persisted transition, spawn
  is an error-only bridge attempt, and no span wraps the bridge's no-op complete branch.
- Assigned compensation span ownership to `SagaCompensator` and cross-plane key ownership to the
  telemetry attribute set.
- Derived public-surface and generated-derivative implications from all four actual writers.
- Measured `check:mcp-export-corpus` green at the baseline (35 packages, 270 subpaths, 7,614
  symbols) and locked its expected post-surface-change stale result as stop/report.
- Assigned the real Flow-B runtime acceptance proof to the supervisor after lease acquisition; the
  author retains only the validator unit gate.
- Measured baseline publish/doc-lint/JSR audit behavior and locked validation expectations.
- Cleared PLAN-EVAL in a separate evaluator session after two cycles.
- Proved the defect red before product edits: missing `saga.cascade.compensate` and missing
  `netscript.correlation.id`, each by assertion.
- Added `netscript.correlation.id` to the canonical saga attribute vocabulary, typed common cascade
  context, optional structural W3C extraction, and engine result transport for the resolved
  correlation ID/key and handle parent.
- Proved S3 with 112-module check/format/lint coverage and 7 focused passing telemetry tests.
- Added engine-owned completion emission for storeless/stored and mixed-terminal outcomes.
- Added bridge-owned send/schedule/rejected-spawn emission with success/error finishing and explicit
  parent/correlation propagation.
- Added compensator-owned success/skipped/error emission, typed post-handler cascade-size recording,
  optional correlation/context fields with no fallback, and compensation-result parent replacement.
- Normalized one instrumentation instance through `createSagaRuntime` and the durable plugin's
  default compensator; proved S4 with 31 focused passing tests.
- Documented owners/outcomes, complete-status semantics, correlation precedence, and optional
  no-fallback compensator behavior in the package README.
- Extended Flow-B with CLI-generated saga registration, an HTTP publish from the active callback
  using `getTraceContext()`, the shared callback/payload correlation fixture, sagas-api discovery,
  and direct `saga.handle -> saga.cascade.compensate` validation.
- Proved S5 with three focused static files, 5/5 validator tests, and a conformant in-scope README;
  recorded the unrelated global bench README failure without editing outside ceiling.
- Proved S6 with 36 focused tests, clean 112-core/84-plugin check-format-lint passes, architecture
  and quality exit 0, both publish dry-runs exit 0, and all three non-mutating shared-asset checks
  green.
- Confirmed the MCP export corpus is stale because existing exported signatures moved; retained the
  supervisor-attributed STOP and made no generated write. Recorded the inherited plugin doctor
  module-tag audit failure without expanding the ceiling.
- Reproduced IMPL-EVAL cycle-1 F2/F3 at `bd89e523` with 10 passed / 2 failed assertions, then fixed
  scheduled child-key precedence and noop compensation handler trace context. The repaired focused
  suite passes 12/12 and the whole core surface passes 84/0/3 ignored.

## In Progress

- Supervisor-owned refreshed Tier-A review and separate-session IMPL-EVAL for the repaired head.

## Next Steps

1. Preserve the repaired author head for refreshed Tier-A and separate-session IMPL-EVAL.
2. Preserve MCP corpus regeneration and the leased Flow-B runtime for supervisor coordination.
3. Do not flip draft state, relabel, merge, or mirror issue acceptance boxes from the author lane.

## Key Decisions

| Decision                                  | Source                                | Notes                                                                                      |
| ----------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| Emit all five cascade factories           | `plan.md` D1–D4/D9                    | Complete is engine-owned; spawn is an error attempt, not a child lifecycle.                |
| Attribute/factory/runtime ownership split | `research.md`, `plan.md` D5–D8        | Publisher key wins cross-plane; definition rule wins saga key; downstream consumes both.   |
| Explicit W3C context handoff              | `plan.md` D7–D8                       | Direct parent survives ended/non-ambient spans.                                            |
| Compensator owns compensate span          | `plan.md` D3                          | Missing, nested, and thrown outcomes are measured at the operation owner.                  |
| No generated writes                       | four-writer inspection, `plan.md` D10 | MCP corpus is expected to move; author stops/reports rather than regenerating.             |
| Leased runtime ownership                  | supervisor review, gate 19            | REQUIRED supervisor-coordinated; author-must-not-run.                                      |
| Optional request fields, no fallback      | PLAN-EVAL cycle 2 F3b                 | Bridge supplies values; absent direct/external values remain absent and are never derived. |
| Complete transition truth                 | PLAN-EVAL cycle 2 F1                  | Emit storeless or stored; status is resolved persisted status, not a success promise.      |

## Files Changed

| Path                                                                                                                             | Status   | Notes                                          |
| -------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------- |
| `.llm/runs/fix-saga-span-emission-and-correlation--0.0.7/*.md`                                                                   | new      | Harness state/evidence                         |
| `packages/plugin-sagas-core/tests/telemetry/saga-cascade-spans_test.ts`                                                          | new      | S2 red-before contract                         |
| `packages/plugin-sagas-core/src/telemetry/{attributes,instrumentation,otel-saga-telemetry}.ts`                                   | modified | S3 typed telemetry/W3C contract                |
| `packages/plugin-sagas-core/src/runtime/saga-engine.ts`                                                                          | modified | Engine-selected correlation/context transport  |
| `packages/plugin-sagas-core/tests/telemetry/{instrumentation,otel-saga-telemetry,saga-engine-spans}_test.ts`                     | modified | S3 contract tests                              |
| `packages/plugin-sagas-core/src/{adapters/saga-bus-bridge,runtime/{create-saga-runtime,saga-compensator}}.ts`                    | modified | S4 operation owners and composition            |
| `plugins/sagas/src/runtime/create-durable-saga-runtime{,_test}.ts`                                                               | modified | Thin default-compensator instrumentation proof |
| `packages/plugin-sagas-core/README.md`                                                                                           | modified | Published telemetry contract                   |
| `packages/cli/e2e/src/application/gates/scaffold/{prepare-flow-b-fixture,validate-flow-b-traces,validate-flow-b-traces_test}.ts` | modified | Generated consumer fixture/unit proof          |

## Gates

| Gate family | Current status | Evidence                                                                  |
| ----------- | -------------- | ------------------------------------------------------------------------- |
| Static      | PASS           | exact-head check/fmt/lint/tests/arch/quality/publish gates green          |
| Fitness     | measured delta | core audit pass; inherited plugin doctor module-tag failure               |
| Runtime     | NOT_RUN        | prohibited without lease                                                  |
| Consumer    | STOP           | expected leaf-caused MCP corpus stale; other three derivative checks pass |
| S2 negative | PASS           | raw exit 1; 0 passed / 2 failed assertions; commit `2146443c`             |
| S3 static   | PASS           | 112 checked/formatted/linted; 7 focused tests passed                      |
| S4 static   | PASS           | core/plugin checks and format/lint clean; 31 focused tests passed         |
| S5 static   | PASS           | three files clean; 5 validator tests; focused README 1/1                  |
| S6 allowed  | PASS           | static/arch/quality/publish/derivatives green; 36 focused tests           |
| MCP corpus  | STOP           | expected leaf-caused signature staleness; no regeneration                 |

## Open Questions

- None. PLAN-EVAL is cleared; implementation carry-forward choices are locked in `worklog.md`.

## Drift and Debt

- Drift: local `origin/main` advanced after the owner-locked baseline; route override and missing
  RTK executable are recorded in `drift.md`.
- Debt: existing plugin-sagas-core JSR/cardinality findings are unchanged and out of scope.

## Commits

- See the draft PR's commit list and per-slice PR comments after the S1 push.
