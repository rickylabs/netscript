# Plan: Emit and correlate saga cascade spans

## Run Metadata

| Field          | Value                                                                           |
| -------------- | ------------------------------------------------------------------------------- |
| Run ID         | `fix-saga-span-emission-and-correlation--0.0.7`                                 |
| Branch         | `fix/saga-span-emission-and-correlation`                                        |
| Phase          | `plan`                                                                          |
| Target         | `packages/plugin-sagas-core`, thin `plugins/sagas` wiring, Flow-B consumer gate |
| Archetype      | `3 - Runtime/Behavior` primary; `5 - Plugin Package` composition overlay        |
| Scope overlays | runtime + telemetry + consumer proof                                            |

## Archetype

Archetype 3 governs the change because saga engine, bridge, compensator, telemetry ports, explicit
failure outcomes, and W3C handoff are runtime behavior. Archetype 5 applies to exactly one thin
plugin composition seam: passing core-owned instrumentation into the default core compensator. The
plugin must not define span names, attributes, trace serialization, or compensation semantics.

## Current Doctrine Verdict

**Keep.** Preserve the saga core's ownership of the state machine and its explicit ports. Complete
the existing observability contract at the actual operation seams; do not introduce a parallel
coordinator or plugin-owned convention.

## Axioms in Play

| Axiom       | Why it matters                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| A1/A2       | One core telemetry vocabulary and explicit injected dependencies prevent split behavior.                    |
| A5          | The composition root must resolve one instrumentation instance for engine, bridge, and default compensator. |
| A7/A8/A9    | Success, skipped, and error outcomes must match real dispatch and compensation behavior.                    |
| A10/A11     | Additive public contracts require docs and lifecycle-symmetric span completion.                             |
| A12/A13/A14 | Consumer proof and structural telemetry ports must remain independently testable.                           |

## Goal

Every returned cascade kind produces its named span at the real runtime seam, with direct W3C
parentage from `saga.handle` (and from compensation to its returned cascades), while every saga span
carries both the cross-plane `netscript.correlation.id` and saga-domain correlation key. Missing or
unsupported behavior remains observable without changing saga semantics.

## Product Path Ceiling

Only the following product, test, documentation, and consumer-gate paths may change after S1:

1. `packages/plugin-sagas-core/src/telemetry/attributes.ts`
2. `packages/plugin-sagas-core/src/telemetry/instrumentation.ts`
3. `packages/plugin-sagas-core/src/telemetry/otel-saga-telemetry.ts`
4. `packages/plugin-sagas-core/src/runtime/saga-engine.ts`
5. `packages/plugin-sagas-core/src/runtime/saga-compensator.ts`
6. `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts`
7. `packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts`
8. `plugins/sagas/src/runtime/create-durable-saga-runtime.ts`
9. `packages/plugin-sagas-core/tests/telemetry/saga-cascade-spans_test.ts` (new)
10. `packages/plugin-sagas-core/tests/telemetry/instrumentation_test.ts`
11. `packages/plugin-sagas-core/tests/telemetry/otel-saga-telemetry_test.ts`
12. `packages/plugin-sagas-core/tests/telemetry/saga-engine-spans_test.ts`
13. `packages/plugin-sagas-core/tests/runtime/create-saga-runtime_test.ts`
14. `packages/plugin-sagas-core/tests/runtime/checkout-saga-contract_test.ts`
15. `plugins/sagas/src/runtime/create-durable-saga-runtime_test.ts`
16. `packages/plugin-sagas-core/README.md`
17. `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts`
18. `packages/cli/e2e/src/application/gates/scaffold/validate-flow-b-traces.ts`
19. `packages/cli/e2e/src/application/gates/scaffold/validate-flow-b-traces_test.ts`

The run artifacts under `.llm/runs/fix-saga-span-emission-and-correlation--0.0.7/` are separately
authorized harness state. Any need to touch a product/test/doc path outside the list above, any
export-map/subpath change, or any shared generated asset is a **rescope-and-stop**: append the
discovery to `drift.md`, make no such edit, and return to the coordinator.

## Scope

- Add the cross-plane correlation constant and typed common cascade context in core telemetry.
- Expose the started handle/compensation span's W3C context through the structural span port,
  following the streams-core precedent.
- Return that context with engine and compensation results so later, non-ambient dispatch spans are
  direct children of the operation that created their cascades.
- Instrument send, schedule, complete, and defensive spawn dispatch in the bridge; instrument
  compensate inside the compensator.
- Resolve one instrumentation dependency in `createSagaRuntime`; inject it into the thin plugin's
  default compensator.
- Add unit/contract tests, package README tables, and a Flow-B generated compensation path plus
  validator assertions.

## Non-Scope

- Implementing child-saga spawn semantics; the existing unsupported error is preserved and traced.
- Changing compensation state-machine semantics, nested compensation support, or issue #1372.
- Stream envelopes (#1329), status taxonomy, persistence schema, public export-map keys, package
  versions, or generated assets.
- Running `e2e:cli`, Aspire, Docker, browser, or other leased gates in this leaf. The fixture and
  validator can be statically/unit tested; the later runtime verdict requires a coordinator-held
  lease.
- Merge, draft flip, issue edits, acceptance-box updates, or ready-merge lifecycle actions.

## Hidden Scope

- A finished handle span must serialize its own W3C context before bridge dispatch; ambient context
  cannot provide the required direct edge.
- Compensation-generated cascades must receive the compensation span context, not the prior handle
  context.
- `createSagaRuntime` must normalize `native.instrumentation` and
  `native.engineOptions.instrumentation` once so engine and bridge cannot silently diverge.
- The plugin's default compensator must receive that instrumentation; custom compensators remain
  caller-configured dependencies.
- Flow-B must add a generated saga whose handler returns `sagaCompensate`, publish it from the
  existing active callback with `getTraceContext()`, and give the workers background resource the
  `sagas-api` endpoint. The validator then proves `saga.handle -> saga.cascade.compensate` and the
  shared correlation value.

## Locked Decisions

| ID  | Decision                                                                                                                            | Rationale                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Emit all five cascade factories.                                                                                                    | Each maps to an actual bridge/compensator operation or a real unsupported dispatch attempt; deletion only hides behavior.                |
| D2  | Finish unsupported `spawn` with `error`, never success.                                                                             | The runtime rejects it and must not imply a child lifecycle occurred.                                                                    |
| D3  | Compensator owns `saga.cascade.compensate`; bridge does not double-emit it.                                                         | This covers direct calls, missing handlers, actual handler duration/cascade size, and nested-defer failures at the measured seam.        |
| D4  | Missing compensation handler emits `skipped` with cascade size zero; nested deferred compensation and thrown handlers emit `error`. | Outcomes reflect current behavior without changing semantics.                                                                            |
| D5  | Attribute-set constant owns `netscript.correlation.id`; runtime selects/propagates the value; factories assemble attributes.        | This preserves telemetry vocabulary layering and avoids raw-key runtime mutation.                                                        |
| D6  | Both correlation attributes use the resolved saga correlation key as the current value.                                             | Cross-plane join and saga lookup remain distinct meanings even where their value is identical.                                           |
| D7  | Use explicit W3C traceparent/tracestate handoff via the structural span port.                                                       | Handle/compensation spans end before their cascades dispatch, so ambient parenting is unreliable; streams-core establishes the pattern.  |
| D8  | Cascade inputs share saga ID, instance ID, correlation ID/key, and parent fields; complete also takes that input.                   | All span factories get a uniform typed correlation/parent contract instead of special-case mutation.                                     |
| D9  | Bridge spans surround the actual send/schedule/complete/spawn switch branch and always finish in `try/catch`.                       | Span lifetime and outcome match the operation, including missing scheduler and unsupported spawn errors.                                 |
| D10 | No generated asset is regenerated.                                                                                                  | Writer inspection shows symbol additions do not require output changes; any stale check triggers stop/report under coordinator ordering. |

## Alternatives Rejected

| Alternative                                       | Why rejected                                                                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Delete the five factories                         | Today's green result is an absent-test false positive and contradicts the runtime observability contract.                      |
| Emit compensation only in the bridge              | Direct compensator callers and missing-handler execution remain invisible; cascade size is unknown before the handler returns. |
| Start every cascade span in the engine            | The engine has not performed the downstream operation and cannot report its real success/error.                                |
| Depend on ambient OTel context                    | The handle span is not active and has ended before dispatch, so direct parentage is not guaranteed.                            |
| Set the raw correlation attribute in runtime code | It leaks telemetry vocabulary across layers and bypasses factory contracts.                                                    |
| Treat unsupported spawn as dead or successful     | Structural dispatch can reach it; deleting loses an error diagnostic and success would lie.                                    |

## Open-Decision Sweep

| Decision                      | Status        | Notes                                                                                              |
| ----------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| Factory liveness              | resolved      | D1–D4 retain all five with truthful outcomes.                                                      |
| Correlation ownership/value   | resolved      | D5–D6 split vocabulary, value resolution, and assembly.                                            |
| Parent propagation            | resolved      | D7–D8 use explicit W3C context.                                                                    |
| Emission seams                | resolved      | D3 and D9 avoid double spans and preserve operation lifetime.                                      |
| Published surface/derivatives | resolved      | Additive types/constants only; all three derived freshness checks are mandatory.                   |
| Flow-B runtime execution      | safe to defer | Fixture/validator code is in scope; Aspire execution is coordinator-gated because no lease exists. |

## Commit Slices

| Slice | Unit                                               | Files                                                                        | Slice gate                                                                                    |
| ----- | -------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| S1    | Research and locked plan                           | run-dir Markdown only                                                        | format/diff/lock checks; separate PLAN-EVAL next                                              |
| S2    | Red-before regression proof only                   | new `saga-cascade-spans_test.ts`                                             | targeted wrapper exits nonzero; record raw exit and exact pass/fail counts against `f8b4f804` |
| S3    | Telemetry contract and explicit W3C handoff        | attributes, instrumentation, OTel adapter, engine + telemetry tests          | targeted check/test wrappers                                                                  |
| S4    | Five runtime emission seams and composition wiring | bridge, compensator, runtime composition, plugin composition + runtime tests | targeted core/plugin check and tests                                                          |
| S5    | Consumer docs and Flow-B assertion                 | README and three Flow-B files                                                | doc lint delta, validator unit test, static checks; no leased runtime execution               |
| S6    | Merge-readiness evidence                           | no planned source writes                                                     | full allowed static/fitness/consumer gates, raw lock/diff checks, then separate IMPL-EVAL     |

Each meaningful slice is committed and pushed by explicit refspec before the next begins.

## Risk Register

| Risk                                                       | Mitigation                                                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| A span leaks or finishes twice on an exception.            | One owner per span, `try/catch`, recording-tracer assertions for terminal outcome/count.             |
| Trace context is invalid or absent for no-op/custom spans. | Structural method returns optional serialized context; dispatch remains valid with no parent.        |
| Compensation cascade children retain the handle parent.    | Result context is replaced with the compensation span's context before recursive dispatch.           |
| Bridge and engine use different instrumentation.           | Resolve one value in the composition root and test the `engineOptions` fallback path.                |
| Flow-B becomes flaky or depends on a synthetic span.       | Use the generated saga, real HTTP publish boundary, real default compensator, and polling validator. |
| Shared generated assets conflict with parallel landings.   | Run check-only derivatives; stop on staleness and never regenerate.                                  |
| Existing JSR doc-lint debt hides regressions.              | Compare exact baseline counts/files and require zero new findings plus publish exit 0.               |

## Anti-Patterns to Resolve or Avoid

| AP         | Status          | Plan                                                                                                      |
| ---------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| AP-3/AP-8  | risk            | Keep domain correlation and telemetry vocabulary distinct; do not move runtime behavior into the adapter. |
| AP-9/AP-10 | existing defect | Make cascade/missing-handler/unsupported outcomes observable and tested.                                  |
| AP-14      | risk            | Thin plugin imports and wires core instrumentation; it defines no duplicate contract.                     |
| AP-20      | risk            | Additive contract change only through existing public subpaths with docs/tests.                           |
| AP-24      | risk            | Extend the existing exhaustive bridge switch; do not add another kind dispatcher.                         |
| AP-25      | risk            | No new global telemetry side effects in core; dependencies stay injected.                                 |

## Fitness Gates

| Gate                | Required | Expected evidence                                                                                    |
| ------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| F-1/F-3             | yes      | Existing export maps and dependency direction remain unchanged; checks pass.                         |
| F-5                 | yes      | Existing `19 > 12` warning does not increase; no folder restructuring.                               |
| F-6/F-7             | yes      | README documents spans/attributes, zero new doc-lint findings, publish dry-runs exit 0.              |
| F-8/F-9             | yes      | Deterministic red-before and success/skipped/error tests cover all factories.                        |
| F-10/F-11/F-12/F-13 | yes      | Injected instrumentation, exact finish counts, runtime seam/consumer contract tests.                 |
| F-14/F-15           | yes      | Thin plugin wiring reuses core types; no new dependencies or lock changes.                           |
| F-16/F-17/F-18/F-19 | yes      | Flow-B validator unit proof, check-only derivative cascade, and later leased consumer runtime proof. |

## Arch-Debt Implications

| Entry                                            | Action       | Notes                                                           |
| ------------------------------------------------ | ------------ | --------------------------------------------------------------- |
| Existing plugin-sagas-core F-DOCT-5/JSR findings | none         | Baseline debt is not caused by this leaf; require no increase.  |
| New architecture debt                            | none planned | Any new exception requires drift entry and rescope before code. |

## Validation Plan

| Order | Gate                                    | Command or check                                                                                                                                                                                                                                                                                   | Expected result                                                                                                                    |
| ----- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1     | S2 measured negative                    | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/plugin-sagas-core/tests/telemetry/saga-cascade-spans_test.ts`                                                                                                                                 | On unchanged `f8b4f804`: raw exit `1`; both compensation-emission and correlation assertions fail. Record actual pass/fail counts. |
| 2     | S2 isolation                            | raw `git diff --name-only HEAD^ HEAD`                                                                                                                                                                                                                                                              | Exactly the new red test file; no product source.                                                                                  |
| 3     | Core check                              | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-sagas-core --ext ts,tsx`                                                                                                                                                                                    | exit `0`, all selected modules checked.                                                                                            |
| 4     | Core targeted tests                     | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --unstable-kv --allow-all packages/plugin-sagas-core/tests/telemetry packages/plugin-sagas-core/tests/runtime/create-saga-runtime_test.ts packages/plugin-sagas-core/tests/runtime/checkout-saga-contract_test.ts` | exit `0`, no failed tests; red tests now pass.                                                                                     |
| 5     | Plugin targeted tests                   | same structured test wrapper against `plugins/sagas/src/runtime/create-durable-saga-runtime_test.ts`                                                                                                                                                                                               | exit `0`, default compensator uses injected telemetry.                                                                             |
| 6     | Source format                           | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-sagas-core --ext ts,tsx` plus focused plugin/Flow-B source roots                                                                                                                                              | exit `0`, no formatting diff.                                                                                                      |
| 7     | Source lint                             | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-sagas-core --ext ts,tsx` plus focused plugin/Flow-B source roots                                                                                                                                             | exit `0`, no lint findings.                                                                                                        |
| 8     | Architecture                            | `deno task arch:check`                                                                                                                                                                                                                                                                             | exit `0`, no new doctrine violation.                                                                                               |
| 9     | JSR doc delta                           | `deno task doc:lint --root packages/plugin-sagas-core --pretty`                                                                                                                                                                                                                                    | Existing exit `1` and exactly the same nine private-type findings; zero new/missing-JSDoc findings.                                |
| 10    | Core publish                            | `deno task --cwd packages/plugin-sagas-core publish:dry-run`                                                                                                                                                                                                                                       | exit `0`.                                                                                                                          |
| 11    | Plugin publish                          | `deno task --cwd plugins/sagas publish:dry-run`                                                                                                                                                                                                                                                    | exit `0`.                                                                                                                          |
| 12    | JSR audit                               | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/plugin-sagas-core --text` and plugin equivalent                                                                                                                                             | exit `0`; no new finding versus recorded baseline.                                                                                 |
| 13    | `check:agent-docs-prose`                | `deno task check:agent-docs-prose`                                                                                                                                                                                                                                                                 | exit `0`, no generated change; otherwise stop/report.                                                                              |
| 14    | `check:publish-assets`                  | `deno task check:publish-assets`                                                                                                                                                                                                                                                                   | exit `0`, no generated change; otherwise stop/report.                                                                              |
| 15    | `check:assets-barrel` (check-only form) | `deno run --no-lock --allow-read --allow-run=deno .llm/tools/generate-cli-assets-barrel.ts --check` (the task normally generates before diffing, so this direct writer mode enforces the same freshness contract without touching shared outputs)                                                  | exit `0`, no generated change; otherwise stop/report.                                                                              |
| 16    | Flow-B validator unit                   | structured test wrapper against `validate-flow-b-traces_test.ts`                                                                                                                                                                                                                                   | exit `0`; direct parent and correlation negative diagnostics covered.                                                              |
| 17    | Flow-B consumer runtime                 | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`                                                                                                                                                                                                                                 | `NOT_RUN` in this leaf: no runtime lease. Must later exit `0` under coordinator-owned lease before acceptance.                     |
| 18    | Lock invariant                          | raw `git diff --exit-code f8b4f804cc5fe77054d4f220974eae66becf090c -- deno.lock`                                                                                                                                                                                                                   | raw exit `0`; byte-unchanged.                                                                                                      |
| 19    | Ceiling/generated invariant             | raw `git diff --name-only f8b4f804...HEAD` plus raw diffs for named shared assets                                                                                                                                                                                                                  | only ceiling/run files; shared generated outputs absent.                                                                           |

RTK is unavailable in this environment (`rtk: command not found`), so structured repo wrappers and
raw commands are the verdict sources. RTK-compressed exploratory output is not used as evidence.

## Dependencies

- `@netscript/telemetry/context` supplies W3C serialization already used by streams-core.
- Existing saga runner/supervisor composition supplies the instrumentation passed through the thin
  plugin factory.
- PLAN-EVAL is required before S2. A coordinator-held runtime lease is required before the Flow-B
  runtime gate.

## Drift Watch

- Any path outside the ceiling, any generated staleness, export-map change, changed baseline,
  compensation semantic change, or need for a runtime lease must be appended to `drift.md` and
  triggers stop/rescope as specified above.
