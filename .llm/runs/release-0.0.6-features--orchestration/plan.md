# Plan — #1398 publish job executions to the durable job stream

Lane: 0.0.6 runtime / public-surface. Control PR #1525. Baseline `origin/main@01aa12b67`.
Research: `slices/research-1398.md`. Target branch `fix/1398-publish-job-executions-to-durable-stream`.

This plan goes to **PLAN-EVAL in a separate session** before any implementation, per
`supervisor.md`.

## Contract

A completed job execution must produce a record on the durable job stream that a consumer,
subscribed **before** the trigger, observes within a bounded time, carrying an identifier that joins
it to its `job.execute` span. The E2E gate that encodes this already exists and is currently
**deferred against this issue**:

- `behavior.otel.stream-consumer` and `behavior.otel.traces`, registered at
  `packages/cli/e2e/src/application/gates/scaffold/otel-gates.ts:52-84`, excluded from
  `scaffold.runtime` / `scaffold.runtime.sqlite` via `SCAFFOLD_RUNTIME_DEFERRED_GATES`
  (`packages/cli/e2e/suites/scaffold/capability-suites.ts:23-34`), with the deferral reason
  *"workers-combined does not install the stream mutation hook"* asserted by
  `packages/cli/e2e/tests/presentation/suite-registry_test.ts:204-215`.

**Definition of done for this issue is therefore mechanical, not rhetorical: those two gates come
out of the deferral list and pass in a real `scaffold.runtime` run.** That is what makes "no
hand-waved timing" enforceable — the bounded-time criterion is the gate's own live SSE loop
(`consume-flow-b-stream.ts:203-230`), not a stopwatch in a PR comment.

## Root cause (verified)

The hook is installed only by the workers **API service**
(`plugins/workers/services/src/main.ts:67`). The **background** entrypoints that generated projects
actually run never install it: `plugins/workers/bin/runtime.ts:89-107`, `:110-122`, `:125-152`.
Generated projects run `startCombinedProcess()`
(`plugins/workers/src/adapter/resources/glue/runtime.stub.ts:21-24`) as the Aspire resource
`workers-combined` (`plugins/workers/src/aspire/workers-contribution.ts:12,56-61`). Job definitions
are published from a different site (`plugins/workers/services/src/init.ts:91-111`), which is why
the stream contained exactly three startup snapshots and nothing else.

This is a **wiring gap**, not a missing feature. The producer, the mapper, the hook, and the
execution record's trace fields all already exist.

## The decision this plan turns on, and the fact that settles it

The research correctly flagged a sharp edge: every execution-state mutation fires the hook
(`packages/plugin-workers-core/src/state/execution-state.ts:288,307`), so installing it publishes
~4 records per execution on the same key — and `executionState.create()`
(`plugins/workers/worker/job-dispatcher.ts:74-86`) runs **before** the `job.execute` span exists
(`:91`). Since TC-14 (`select-flow-b-stream-change.ts:122-153`) matches on `correlationId` and then
asserts the matched record's `headers.traceparent` trace id equals the `job.execute` trace id, a
naive "install the hook, publish everything" fix can match a record that fails the assertion.

Two facts I verified directly resolve this:

1. **`job.execute` is a child of the stored dispatch traceparent.**
   `plugins/workers/worker/job-dispatcher.ts:44` computes
   `parentContext = tracedContext?.parentContext ?? getParentContextFromHeaders(traceHeaders)` and
   passes it to `traceJobExecution` at `:108`, which forwards it as `parentContext`
   (`packages/telemetry/src/instrumentation/worker.ts:300`). So the `job.execute` span **shares its
   trace id** with the `traceparent` already stored on the execution record
   (`execution-state.ts:74`).
2. **The publish span's trace id comes from the ambient OTel context.**
   `packages/plugin-streams-core/src/telemetry/instrumentation.ts:160` calls `startSpan` with no
   explicit context, and the header is `formatTraceparent(span.spanContext())` (`:172`).

**Therefore:** if the mutation hook publishes under a context extracted from the execution record's
own stored `traceparent`, then *every* published record — including the pre-span `create()` one —
carries a header traceparent whose trace id equals the `job.execute` trace id. TC-14 passes no
matter which of the four records the selector matches first.

That removes the sharp edge without moving `create()` and without restricting publication to
terminal states.

### Alternatives considered and rejected

| Option | Why rejected |
| --- | --- |
| Publish only terminal (`complete`) mutations, relying on ambient context | Passes TC-14 by accident of call placement — the join holds only because `complete()` happens to sit inside the span callback (`:165-170`). Any future refactor that moves the call silently breaks the join with no failing test. It also discards running-state visibility that the stream is for. |
| Move `executionState.create()` inside the `job.execute` span | Reorders execution-state semantics (the record must exist before the span names its `executionId`, `:88` → `:103`) to serve a telemetry concern. Wrong direction of dependency. |
| Add `traceparent` to `WorkerExecutionZodSchema` and join on the field | The gate asserts the **header**, not the field (`select-flow-b-stream-change.ts:122-153`). Changing the schema also raises a published-surface version question the research could not settle ("whether the streams schema carries an explicit version marker" — unverified). Not needed for the join. |

## Locked decisions

- **D1** — Install the stream mutation hook on the background runtimes in
  `plugins/workers/bin/runtime.ts`, mirroring `plugins/workers/services/src/main.ts:65-75`. Cover
  `startWorkerProcess` and `startCombinedProcess`; `startSchedulerProcess` only if it owns execution
  state. Installation must be idempotent and must not double-install when a process embeds the API
  service.
- **D2** — Publish **all** execution mutations (created / updated / deleted), not just terminal ones.
- **D3** — The hook publishes under an OTel context extracted from the execution record's stored
  `traceparent`/`tracestate`, so the publish span joins the `job.execute` trace. This is the
  join mechanism; it is not optional and it is what the new unit test pins.

  **Amended after PLAN-EVAL (finding F1 — verified).** The mechanism is now explicit rather than
  implied: `StreamsTracerPort.startSpan`
  (`packages/plugin-streams-core/src/telemetry/instrumentation.ts:92-102`) takes **no parent-context
  argument**, so the *only* way for the publish span to inherit the stored trace id is for
  `createStreamMutationHook` (`packages/plugin-workers-core/src/streams/producer.ts:108-118`) to wrap
  its `producer.upsert(...)` call in
  `context.with(extractContext({ traceparent, tracestate }), () => producer.upsert(...))`. Today that
  call has no wrapping at all. An implementation that installs the hook without this wrapping will
  appear to work and will fail TC-14 on the `create()` record — the exact trap this plan exists to
  avoid.
- **D4** — **No change to `WorkerExecutionZodSchema`** and no new public export. If implementation
  shows the join cannot be made without a schema field, that is a stop-and-report, not a decision to
  take in-slice.
- **D5** — Remove `behavior.otel.stream-consumer` and `behavior.otel.traces` from
  `SCAFFOLD_RUNTIME_DEFERRED_GATES` and update the assertion in
  `suite-registry_test.ts:204-215`. The deferral list is the issue's own acceptance surface; leaving
  it in place while claiming the fix would be a false-done.

## Slices

**S0 — environment precondition: RESOLVED before dispatch, no longer blocking.**

Answered by the orchestrator on 2026-08-12. **`workers-combined` does receive the streams URL.**

`generate-register-background.ts:200-218` emits
`await <id>.withEnvironment('services__<ref>__http__0', <ref>Endpoint)` for every entry in the
background processor's `PluginReferences`, and
`packages/cli/src/public/features/plugins/install/install-plugin_test.ts:1393-1396` asserts that
`BackgroundProcessors.workers.PluginReferences` is exactly `['streams', 'workers-api']`. That is the
env name `stream-url-resolver.ts:154-190` reads. So the wiring exists by design.

**Correction, recorded rather than quietly fixed.** I first read
`plugins/workers/src/aspire/workers-contribution.ts:55-63` — which calls `addDenoBackground` with no
reference to `streams` and only `builder.waitFor(combined, api)` — and concluded the env was missing
and the slice needed an extra Aspire slice. That was **wrong**: `PluginReferences` is not derived
from the contribution file at all. It is reconciled from the plugin manifest's
`.withDependencies({ streams: streamsPlugin })` (`plugins/workers/src/public/mod.ts:61`),
independently of install order, per the test above. Checking the mechanism instead of trusting the
first plausible file is what kept an unnecessary slice out of this plan.

**Residual, for the implementer to confirm in the live run only:** the generated code guards with
`if (<ref>Endpoint)`, so the env is silently omitted if the streams resource exposes no `http`
endpoint at wiring time. That is a runtime observation for S3, not a design unknown.

**S1 — hook installation + trace-context join** (D1, D2, D3) with unit tests.

**S2 — un-defer the two OTEL gates** (D5) and make `suite-registry_test.ts` assert the new state.

**Amended after PLAN-EVAL (finding F2 — verified).** This plan originally named only
`suite-registry_test.ts:204-215`. There is a **second** test that also pins the deferral and must be
updated in the *same commit*: `suite-registry_test.ts:209-234`,
`'runtime suites pin the exact #1398 OTEL deferral without widening it'`, which asserts
`SCAFFOLD_RUNTIME_DEFERRED_GATES` equals the exact two-entry list (`:210-221`) **and** that neither
runtime tier executes a deferred gate (`:223-233`). Both tiers reference the constant
(`capability-suites.ts:211,218`). Emptying the constant without rewriting this test leaves S2 red.
Confirmed by reading both tests directly.

**S3 — live runtime evidence**: one `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
run, with the two previously-deferred gates passing, plus the Aspire trace showing producer →
durable stream → SSE consumer in one trace.

## Tests

1. **Unit — the join.** Mutation hook publishes under a stored `traceparent`; assert the publish
   span's trace id equals that traceparent's trace id. Today's suite
   (`packages/plugin-workers-core/tests/streams/workers-streams_test.ts:9-104`) has **no traceparent
   assertion** — this is the gap that let the defect ship.
2. **Unit — installation.** The background runtime path installs a mutation hook; a test that fails
   if `startCombinedProcess` stops installing it. **There is currently no such test, which is
   precisely why `workers-combined` shipped without the hook.**
3. **Unit — pre-span publication.** A mutation emitted *before* any ambient `job.execute` span still
   produces a publish span on the stored trace id (pins D3 against the `create()` case).
4. **E2E** — the two un-deferred gates, live.

## Gates

Scoped wrappers over `plugins/workers`, `packages/plugin-workers-core`, `packages/cli`; plus
`deno task quality:gate` (mandatory — `packages/**`/`plugins/**` slice) and
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` for S3. The E2E gate is expensive
and **serialised across this lane** — it does not run concurrently with any other slice's run.

## Risks

- **R1 (blocking, S0)** — streams env may not reach `workers-combined`. Resolved before code.
- **R2** — publishing ~4 records per execution against a 256-event / 1 MiB bounded buffer
  (`producer-contract-v1.ts:47-55`) raises volume on busy workers. Not a correctness risk (drops are
  metered and settled), but worth a recorded note; #1405's reason taxonomy is what makes any such
  drop legible, which is why it lands first.
- **R3** — the two undeclared `@netscript/plugin-streams-core` imports in
  `packages/plugin-workers-core/deno.json` and `plugins/triggers/deno.json` are real but
  **out of scope** here. If `publish:dry-run` flags them, they get their own issue rather than
  being absorbed into this PR.

## Acceptance mapping (#1398)

| Box | Satisfied by | Evidence |
| --- | --- | --- |
| Completed execution results in a published record | D1 + D2 | unit test 2 + S3 live run |
| Record carries an identifier joining it to `job.execute` | D3 | unit tests 1 and 3 + TC-14 in S3 |
| Live subscription opened before trigger observes it within bounded time | D5 | `behavior.otel.stream-consumer` passing live (`consume-flow-b-stream.ts:203-230`) |
| A test asserts the join | tests 1–3 + un-deferred E2E | red-on-regression demonstrated |
