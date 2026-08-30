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

### Ceiling Completeness Checks

| Consumer/check               | Ceiling consequence                                                                                                                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLI assets barrel            | Its writer reads package names and export-map keys; no key changes are planned, so no generated path enters the ceiling.                                                                                                         |
| MCP export corpus            | Its writer records normalized exported symbol signatures; the planned constants and structural type changes are expected to make the checked-in corpus stale. The corpus remains outside the ceiling and gate 16 is stop/report. |
| Dependency-closure parity    | Its verifier only tracks `@netscript/fresh`, `@netscript/sdk`, and `@netscript/telemetry` specifiers, so the sagas-core symbol changes do not add a path.                                                                        |
| `docs:exports-drift`         | Its authoritative mapping has no `plugin-sagas-core` entry, so the README/API work does not add a path.                                                                                                                          |
| Structural span implementors | The only non-production `SagaTelemetrySpan` implementors are the two telemetry test doubles already inside the ceiling; no additional product path is required.                                                                  |

## Scope

- Add the cross-plane correlation constant and typed common cascade context in core telemetry.
- Expose the started handle/compensation span's W3C context through the structural span port,
  following the streams-core precedent.
- Return that context with engine and compensation results so later, non-ambient dispatch spans are
  direct children of the operation that created their cascades.
- Instrument send, schedule, and defensive spawn dispatch in the bridge; instrument compensate
  inside the compensator; instrument complete in the engine around the persisted completion
  transition that actually sets `status: 'completed'` and `completedAt`.
- Resolve one instrumentation dependency in `createSagaRuntime`; inject it into the thin plugin's
  default compensator.
- Add unit/contract tests, package README tables, and a Flow-B generated compensation path plus
  validator assertions.

## Non-Scope

- Implementing child-saga spawn semantics; the existing unsupported error is preserved and traced.
- Instrumenting the exported engine-as-bus `SagaEngine.dispatchCascaded()` compatibility path. The
  production composition root always routes returned cascades through `SagaBusBridge`; the direct
  engine path has no originating handle result from which to consume the locked correlation/parent
  values. Expanding `SagaBusPort` to invent that context is a separate public-contract change.
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
- The bridge must pass the normalized instrumentation and engine-selected execution context into
  each compensation call. This makes a baseline-compatible `new SagaCompensator({ clock })` supplied
  to `createSagaRuntime` observable without requiring the S2 test to use a future constructor
  option. The plugin's default compensator may also receive the dependency at construction for
  direct-call coverage; operation-scoped bridge input wins.
- The engine resolves two values once: saga correlation key is
  `definition.correlate(message) ?? message.correlationKey ?? '<sagaId>:<type>'`, while cross-plane
  correlation ID is `message.correlationKey ?? resolvedSagaCorrelationKey`. Engine results, cascade
  inputs, and compensation requests carry those exact values; bridge and compensator never run
  either precedence rule again.
- Flow-B must add a generated saga whose handler returns `sagaCompensate`, publish it from the
  existing active callback with `getTraceContext()`, and give the workers background resource the
  `sagas-api` endpoint. The HTTP `correlationId` and the generated saga payload field used by its
  correlate rule must both equal the callback's `flowBCorrelationId`; that equality is a fixture
  precondition, not a hoped-for side effect. The validator then proves
  `saga.handle -> saga.cascade.compensate` and the shared cross-plane value. It does not treat the
  bridge's no-op `complete` branch as an operation or require a synthetic completion marker.

## Factory Liveness and Ownership

| Factory                   | Owner and measured operation                   | Contract                                                                                                                  |
| ------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `saga.cascade.send`       | Bridge; nested publish/handle dispatch         | success/error around the real downstream call                                                                             |
| `saga.cascade.schedule`   | Bridge; scheduler dispatch                     | success/error, including missing scheduler                                                                                |
| `saga.cascade.complete`   | Engine; persisted completion transition        | direct child of `saga.handle`; surrounds completed-status/completedAt persistence and records saga status/result presence |
| `saga.cascade.compensate` | Compensator; registered compensation execution | success/skipped/error and returned cascade size                                                                           |
| `saga.cascade.spawn`      | Bridge; defensive rejected attempt             | error-only; never claims a child lifecycle                                                                                |

The README table documents these owners and explicitly labels spawn error-only. Flow-B exercises and
documents the engine-handle to compensator edge; it relies on the engine-owned interpretation of
complete and does not publish a zero-duration bridge marker.

## Locked Decisions

| ID  | Decision                                                                                                                                                                                                         | Rationale                                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Emit all five cascade factories at the operation owner named above.                                                                                                                                              | Send/schedule are real bridge calls, complete is a real engine persistence transition, compensate is real handler execution, and spawn is a real rejected attempt; deletion only hides behavior. |
| D2  | Finish unsupported `spawn` with `error`, never success.                                                                                                                                                          | The runtime rejects it and must not imply a child lifecycle occurred.                                                                                                                            |
| D3  | Compensator owns `saga.cascade.compensate`; bridge supplies operation instrumentation/context but does not double-emit it.                                                                                       | The compensator alone knows missing-handler outcome, actual handler duration/cascade size, and nested-defer failures at the measured seam.                                                       |
| D4  | Missing compensation handler emits `skipped` with cascade size zero; nested deferred compensation and thrown handlers emit `error`.                                                                              | Outcomes reflect current behavior without changing semantics.                                                                                                                                    |
| D5  | Attribute-set constant owns `netscript.correlation.id`; runtime selects/propagates the value; factories assemble attributes.                                                                                     | This preserves telemetry vocabulary layering and avoids raw-key runtime mutation.                                                                                                                |
| D6  | `netscript.saga.correlation_key` uses the engine's existing definition-rule-first resolution; `netscript.correlation.id` uses publisher `message.correlationKey` when present, otherwise that resolved saga key. | A publisher-supplied cross-plane join survives a different domain correlate rule while the saga lookup key keeps its existing semantics.                                                         |
| D7  | Use explicit W3C traceparent/tracestate handoff via the structural span port.                                                                                                                                    | Handle/compensation spans end before their cascades dispatch, so ambient parenting is unreliable; streams-core establishes the pattern.                                                          |
| D8  | Engine results and `SagaCompensationRequest` carry the engine-selected correlation ID/key plus parent fields; every downstream span consumes them unchanged.                                                     | The bridge and compensator must not recompute precedence and cannot diverge from `saga.handle`; the published request/result signature change is explicit.                                       |
| D9  | Bridge spans surround send/schedule/spawn; the engine span surrounds the actual complete transition; all owners finish in `try/catch`.                                                                           | Span lifetime matches the operation. In particular, the bridge's `case 'complete': return` is never wrapped and cannot report synthetic success.                                                 |
| D10 | No generated asset is regenerated.                                                                                                                                                                               | Writer inspection proves the MCP export corpus will move while the other three shared outputs should not; every stale result triggers stop/report under coordinator ordering.                    |

## Published Surface and Derivative Decision

Emitting the factories does change the published surface even though all five factory functions
already exist: existing exported telemetry/runtime structural types gain correlation/context fields,
`SagaAttributes` gains a constant, and compensation instrumentation becomes an explicit dependency.
`SagaCompensationRequest` is the handoff contract for engine-selected correlation values, so this
plan treats that signature movement as intentional rather than hiding a recompute inside the
compensator. No package export-map key or subpath changes.

Because the MCP writer records normalized symbol signatures, `check:mcp-export-corpus` is expected
to report the checked-in corpus stale after implementation. The check-only derivative cascade is
mandatory; no shared asset is regenerated in this lane. The agent-docs prose, publish assets, and
CLI assets barrel are expected to remain fresh for the writer-derived reasons recorded above.

## Alternatives Rejected

| Alternative                                       | Why rejected                                                                                                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delete the five factories                         | Today's green result is an absent-test false positive and contradicts the runtime observability contract.                                                                                    |
| Emit compensation only in the bridge              | Direct compensator callers and missing-handler execution remain invisible; cascade size is unknown before the handler returns.                                                               |
| Start every cascade span in the engine            | Rejected for send/schedule/spawn because the engine has not performed those downstream operations. Complete is the deliberate exception because the engine owns and persists its transition. |
| Emit complete as a bridge marker                  | The branch only returns; a zero-duration success marker would measure no work and publish a misleading contract.                                                                             |
| Depend on ambient OTel context                    | The handle span is not active and has ended before dispatch, so direct parentage is not guaranteed.                                                                                          |
| Set the raw correlation attribute in runtime code | It leaks telemetry vocabulary across layers and bypasses factory contracts.                                                                                                                  |
| Treat unsupported spawn as dead or successful     | Structural dispatch can reach it; deleting loses an error diagnostic and success would lie.                                                                                                  |

## Open-Decision Sweep

| Decision                      | Status        | Notes                                                                                                                                                                                     |
| ----------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Factory liveness              | resolved      | D1–D4 retain all five with truthful outcomes.                                                                                                                                             |
| Correlation ownership/value   | resolved      | D5–D8 lock both precedence rules and require downstream consumers to use engine-selected values.                                                                                          |
| Parent propagation            | resolved      | D7–D8 use explicit W3C context.                                                                                                                                                           |
| Emission seams                | resolved      | D1, D3, and D9 put complete in the engine, three dispatch kinds in the bridge, and compensation in the compensator.                                                                       |
| Published surface/derivatives | resolved      | Existing exported subpaths gain constants and structural signature fields; no export-map key changes, but the MCP corpus is expected to move and all four freshness checks are mandatory. |
| Flow-B runtime execution      | safe to defer | Fixture/validator code is in scope; Aspire execution is coordinator-gated because no lease exists.                                                                                        |

## Commit Slices

| Slice | Unit                                               | Files                                                                      | Slice gate                                                                                                                                  |
| ----- | -------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| S1    | Research and locked plan                           | run-dir Markdown only                                                      | format/diff/lock checks; separate PLAN-EVAL next                                                                                            |
| S2    | Red-before regression proof only                   | new `saga-cascade-spans_test.ts`                                           | existing-surface test compiles, then wrapper exits nonzero by exactly two assertion failures; record raw exit and counts against `f8b4f804` |
| S3    | Telemetry contract and explicit W3C handoff        | attributes, instrumentation, OTel adapter, engine + telemetry tests        | targeted check/test wrappers                                                                                                                |
| S4    | Five runtime emission seams and composition wiring | engine completion, bridge, compensator, runtime/plugin composition + tests | targeted core/plugin check and tests                                                                                                        |
| S5    | Consumer docs and Flow-B assertion                 | README and three Flow-B files                                              | doc lint delta, validator unit test, static checks; no leased runtime execution                                                             |
| S6    | Merge-readiness evidence                           | no planned source writes                                                   | full allowed static/fitness/consumer gates, raw lock/diff checks, then separate IMPL-EVAL                                                   |

Each meaningful slice is committed and pushed by explicit refspec before the next begins.

### S2 Red-Before Contract

The new test file uses only APIs accepted by `f8b4f804`. It creates a recording
`SagaTelemetryTracer`, injects it through
`createSagaRuntime({ native: { instrumentation, compensator: new SagaCompensator({ clock }) } })`,
registers a saga whose handler returns `sagaCompensate(...)` and whose `.compensate()` handler is
registered, and publishes with an explicit correlation key. Two independent tests assert:

1. a `saga.cascade.compensate` span was started; and
2. the `saga.handle` span attributes contain `netscript.correlation.id`.

On unchanged main, both tests must reach their assertions and fail there. The receipt must report
raw exit `1` and `N passed / 2 failed` with `N >= 0`. Exit `1` with zero failed tests, a type-check
error, module-load failure, or runtime crash does **not** satisfy the red-before gate. Tests for a
new compensator option, engine-result fields, request fields, or structural `spanContext()` method
belong to S3/S4 and are not prerequisites for compiling S2.

## Risk Register

| Risk                                                       | Mitigation                                                                                                                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A span leaks or finishes twice on an exception.            | One owner per span, `try/catch`, recording-tracer assertions for terminal outcome/count.                                                                           |
| Trace context is invalid or absent for no-op/custom spans. | Structural method returns optional serialized context; dispatch remains valid with no parent.                                                                      |
| Compensation cascade children retain the handle parent.    | Result context is replaced with the compensation span's context before recursive dispatch.                                                                         |
| Bridge and engine use different instrumentation.           | Resolve one value in the composition root and test the `engineOptions` fallback path.                                                                              |
| Handle and compensation choose different correlation IDs.  | Engine selects both values once; engine results and compensation requests transport them, and tests use a correlate rule that disagrees with the publisher key.    |
| Flow-B becomes flaky or depends on a synthetic span.       | Use the generated saga, real HTTP publish boundary, real default compensator, and polling validator.                                                               |
| Shared generated assets conflict with parallel landings.   | Run only non-mutating derivative checks; the expected MCP corpus stale result and any unexpected stale result are stop/report handoffs, never author regeneration. |
| Existing JSR doc-lint debt hides regressions.              | Compare exact baseline counts/files and require zero new findings plus publish exit 0.                                                                             |

## Anti-Patterns to Resolve or Avoid

| AP         | Status          | Plan                                                                                                              |
| ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| AP-3/AP-8  | risk            | Keep domain correlation and telemetry vocabulary distinct; do not move runtime behavior into the adapter.         |
| AP-9/AP-10 | existing defect | Make cascade/missing-handler/unsupported outcomes observable and tested.                                          |
| AP-14      | risk            | Thin plugin imports and wires core instrumentation; it defines no duplicate contract.                             |
| AP-20      | risk            | Evolve structural contracts only through existing public subpaths with explicit docs/tests and derivative checks. |
| AP-24      | risk            | Extend the existing exhaustive bridge switch; do not add another kind dispatcher.                                 |
| AP-25      | risk            | No new global telemetry side effects in core; dependencies stay injected.                                         |

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

| Order | Gate                                                                            | Command or check                                                                                                                                                                                                                                                                                   | Expected result                                                                                                                                                                                                              |
| ----- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | S2 measured negative                                                            | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/plugin-sagas-core/tests/telemetry/saga-cascade-spans_test.ts`                                                                                                                                 | On unchanged `f8b4f804`, the baseline-compatible file compiles and both independent tests reach assertion failure: raw exit `1`, `N passed / 2 failed` (`N >= 0`). A compile/load/crash red or zero failed tests is invalid. |
| 2     | S2 isolation                                                                    | raw `git diff --name-only HEAD^ HEAD`                                                                                                                                                                                                                                                              | Exactly the new red test file; no product source.                                                                                                                                                                            |
| 3     | Core check                                                                      | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-sagas-core --ext ts,tsx`                                                                                                                                                                                    | exit `0`, all selected modules checked.                                                                                                                                                                                      |
| 4     | Core targeted tests                                                             | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --unstable-kv --allow-all packages/plugin-sagas-core/tests/telemetry packages/plugin-sagas-core/tests/runtime/create-saga-runtime_test.ts packages/plugin-sagas-core/tests/runtime/checkout-saga-contract_test.ts` | exit `0`, no failed tests; red tests now pass.                                                                                                                                                                               |
| 5     | Plugin targeted tests                                                           | same structured test wrapper against `plugins/sagas/src/runtime/create-durable-saga-runtime_test.ts`                                                                                                                                                                                               | exit `0`, default compensator uses injected telemetry.                                                                                                                                                                       |
| 6     | Source format                                                                   | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-sagas-core --ext ts,tsx` plus focused plugin/Flow-B source roots                                                                                                                                              | exit `0`, no formatting diff.                                                                                                                                                                                                |
| 7     | Source lint                                                                     | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-sagas-core --ext ts,tsx` plus focused plugin/Flow-B source roots                                                                                                                                             | exit `0`, no lint findings.                                                                                                                                                                                                  |
| 8     | Architecture                                                                    | `deno task arch:check`                                                                                                                                                                                                                                                                             | exit `0`, no new doctrine violation.                                                                                                                                                                                         |
| 9     | JSR doc delta                                                                   | `deno task doc:lint --root packages/plugin-sagas-core --pretty`                                                                                                                                                                                                                                    | Existing exit `1` and exactly the same nine private-type findings; zero new/missing-JSDoc findings.                                                                                                                          |
| 10    | Core publish                                                                    | `deno task --cwd packages/plugin-sagas-core publish:dry-run`                                                                                                                                                                                                                                       | exit `0`.                                                                                                                                                                                                                    |
| 11    | Plugin publish                                                                  | `deno task --cwd plugins/sagas publish:dry-run`                                                                                                                                                                                                                                                    | exit `0`.                                                                                                                                                                                                                    |
| 12    | JSR audit                                                                       | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/plugin-sagas-core --text` and plugin equivalent                                                                                                                                             | exit `0`; no new finding versus recorded baseline.                                                                                                                                                                           |
| 13    | `check:agent-docs-prose`                                                        | `deno task check:agent-docs-prose`                                                                                                                                                                                                                                                                 | exit `0`, no generated change; otherwise stop/report.                                                                                                                                                                        |
| 14    | `check:publish-assets`                                                          | `deno task check:publish-assets`                                                                                                                                                                                                                                                                   | exit `0`, no generated change; otherwise stop/report.                                                                                                                                                                        |
| 15    | `check:assets-barrel` (check-only form)                                         | `deno run --no-lock --allow-read --allow-run=deno .llm/tools/generate-cli-assets-barrel.ts --check` (the task normally generates before diffing, so this direct writer mode enforces the same freshness contract without touching shared outputs)                                                  | exit `0`, no generated change; otherwise stop/report.                                                                                                                                                                        |
| 16    | `check:mcp-export-corpus`                                                       | `deno task check:mcp-export-corpus`                                                                                                                                                                                                                                                                | Baseline measured exit `0` (35 packages, 270 subpaths, 7,614 symbols). After the planned exported signature changes, expect nonzero stale-corpus result; stop/report for supervisor sequencing and do not regenerate.        |
| 17    | `docs:readme:check`                                                             | `deno task docs:readme:check`                                                                                                                                                                                                                                                                      | exit `0`; the edited package README satisfies the repository standard.                                                                                                                                                       |
| 18    | Flow-B validator unit                                                           | structured test wrapper against `validate-flow-b-traces_test.ts`                                                                                                                                                                                                                                   | exit `0`; direct parent and correlation negative diagnostics covered; fixture contract requires HTTP and payload correlation inputs both equal `flowBCorrelationId`.                                                         |
| 19    | Flow-B consumer runtime — REQUIRED, supervisor-coordinated, author-must-not-run | The supervisor, after acquiring the cluster-wide runtime lease, selects and records the canonical `scaffold.runtime` invocation. The author does not invoke `e2e:cli`, Aspire, Docker, or browser gates.                                                                                           | Acceptance remains pending until supervisor-owned evidence exits `0`; it must demonstrate the generated saga correlation equals the callback `flowBCorrelationId`. `NOT_RUN` by this author is boundary compliance.          |
| 20    | Lock invariant                                                                  | raw `git diff --exit-code f8b4f804cc5fe77054d4f220974eae66becf090c -- deno.lock`                                                                                                                                                                                                                   | raw exit `0`; byte-unchanged.                                                                                                                                                                                                |
| 21    | Ceiling/generated invariant                                                     | raw `git diff --name-only f8b4f804...HEAD` plus raw diffs for named shared assets                                                                                                                                                                                                                  | only ceiling/run files; shared generated outputs absent.                                                                                                                                                                     |

RTK is unavailable in this environment (`rtk: command not found`), so structured repo wrappers and
raw commands are the verdict sources. RTK-compressed exploratory output is not used as evidence.

## Dependencies

- `@netscript/telemetry/context` supplies W3C serialization already used by streams-core.
- Existing saga runner/supervisor composition supplies the instrumentation passed through the thin
  plugin factory.
- PLAN-EVAL is required before S2. The Flow-B runtime acceptance gate belongs exclusively to the
  supervisor after it acquires the cluster-wide lease; the author must not run it.

## Drift Watch

- Any path outside the ceiling, any generated staleness, export-map change, changed baseline,
  compensation semantic change, or need for a runtime lease must be appended to `drift.md` and
  triggers stop/rescope as specified above.
