# IMPL-EVAL — W2-B #1329 versioned stream SSE envelope (PR #1395)

**Verdict: PASS** — branch `origin/fix/streams-versioned-sse-envelope@371e4ba0a`, evaluated against
`origin/main` (contains `da5cb2887`) by a separate Claude · Fable 5 · medium session on 2026-08-09.
Generator was Codex · GPT-5.6 Sol · medium; evaluator route is the canonical opposite-family
`formal_impl_evaluation` binding. Read-only; no code was repaired. Gates below were re-run
independently in a detached scratchpad worktree at the PR head (removed after evaluation).

## The row-6 split is legitimate

The split is honest. It is not covering a defect in this slice. Evidence, independently derived
from the producer-side source, not from the lane's audit:

1. **"Never published" is structurally true in the code.** The execution→stream publication path
   exists — `packages/plugin-workers-core/src/streams/producer.ts` `createStreamMutationHook`
   upserts `toExecutionStreamEntity(execution)` into the `/workers/executions` durable stream —
   but the only production call to `setMutationHook` in the entire tree is
   `plugins/workers/services/src/main.ts:67`, the workers **API service** process. The Aspire
   contribution (`plugins/workers/src/aspire/workers-contribution.ts`) runs triggered/scheduled
   executions in the separate `workers-combined` resource (`plugins/workers/bin/combined.ts` →
   `startCombinedProcess`/`startWorkerProcess` in `plugins/workers/bin/runtime.ts`), and none of
   those entrypoints installs the hook on the `KvExecutionState` they construct. The job
   dispatcher (`plugins/workers/worker/job-dispatcher.ts:74,165`) therefore calls
   `create`/`complete` on a state store whose `#onMutation` is undefined
   (`packages/plugin-workers-core/src/state/execution-state.ts:307` fires the hook only when set).
   Nothing publishes an execution record. The audit's empirical method (live subscription held
   from the committed offset across a trigger for 25 s; identical before/after snapshots;
   cursor-only advancement) agrees with what the code says must happen. This is a wiring/product
   gap in the workers plugin, outside #1329's SSE-envelope/consumer surface. The alternative
   producer path was also ruled out: `plugins/triggers/streams/producer.ts` defines a trigger-event
   stream hook that no triggers service imports — no stream anywhere carries a `trg_evt_*`
   correlated record today.
2. **The consumer would have handled the record had it existed.** The execution record stores the
   trigger correlation (`correlationId` from the queue message, `job-dispatcher.ts:83`) and
   `toExecutionStreamEntity` preserves it in `value.correlationId`; the selector
   (`packages/cli/e2e/.../select-flow-b-stream-change.ts`) matches exactly `value.correlationId`
   with a header fallback. Header `traceparent` is injected from the publish span
   (`instrumentation.ts` `formatTraceparent(span.spanContext())`), which in the executing process
   would share the `job.execute` trace, satisfying `assertFlowBChangeContext`. Startup definition
   snapshots are skipped as observed-but-unmatched identities, so a published execution record is
   selectable and verifiable.
3. **TC-14 is genuinely #1398's acceptance test.** Today it fails for the stated reason: the
   bounded selector (40 batches / 20 s, verified in `consume-flow-b-stream.ts:25-26`) exhausts
   observing only `flow-b-callback`, `health-check`, `workers-plugin-health-check` — the recorded
   serialized ledger-row-39 failure. The two negatives — `TC-14 rejects a matched record without
   traceparent` and `TC-14 rejects a matched record whose trace differs from the producer` — are
   real `assertThrows` on `assertFlowBChangeContext` with reason-specific messages, not vacuous
   passes; I ran them (8 passed / 0 failed). Once #1398 publishes executions with correlation and
   W3C context, the selector matches and TC-14's dashboard link assertion becomes decidable.
4. **The diagnostic trail is coherent.** Serialized run 1 (74/1, `behavior.otel.traces` FAIL) →
   instrumented diagnostic (link identities resolved to startup `stream.publish` records —
   correctly classified as a gate-side selection defect, not a product context drop) → selector
   repair `f0d5bf585` → serialized run 2 (73/1, consumer gate FAIL by exhaustion, TC-14 not
   executed, honestly not claimed) → no-token join audit `6c6e5980a` distinguishing "never
   published" from "published but unmatchable". No retries, token discipline observed, each pass
   recorded with raw exit codes.
5. **Authority for the split is disclosed accurately.** The final orchestrator comment corrects
   the "owner-approved" phrasing to "owner-ratified pattern (#1202 row 2), orchestrator-applied
   decision", with an explicit reversal path. #1398 (0.0.6, p1) carries correct acceptance
   criteria targeting exactly the missing publication and the join test, and `Refs #1329` without
   a closing keyword.

## Findings by severity

No blocking findings.

- **F1 (low, for #1398, not this slice)** — The fix surface is narrower than #1398's body implies:
  the publication code path exists and is dead only because `setMutationHook` is wired solely in
  `plugins/workers/services/src/main.ts`; the executing processes
  (`plugins/workers/bin/runtime.ts` `startWorkerProcess`/`startSchedulerProcess`/
  `startCombinedProcess`) never install it. The parallel triggers hook
  (`plugins/triggers/streams/producer.ts` `createStreamMutationHook`) is wired nowhere. #1398
  should cite these sites so the join test lands against the real defect.
- **F2 (informational)** — `bindStreamEventSourceV1`
  (`packages/plugin-streams-core/src/application/stream-sse-v1.ts:209-210`) registers listeners
  with inline `'data'`/`'control'` literals typed as a structural union rather than referencing
  `STREAM_SSE_WIRE_EVENT_NAMES_V1`. Same-module, same-authority — not a parallel table — and the
  real-server conformance test pins the names; no action required.
- **F3 (informational)** — Row 3's real-generated-service proof rests on serialized run 1, where
  `behavior.otel.stream-consumer` passed (943 ms) including the verbatim extracted example; run 2
  failed that gate at Flow-B selection. Verified sound: every commit after run 1
  (`bdb29074b..371e4ba0a`) touches only `.llm/runs/**` and `packages/cli/e2e/**`, so the product
  and consumer surface run 1 proved is byte-identical at head, and the copy-exact/type-check
  focused test passes at head.

## Independently verified evidence

- **Producer-side row-6 verification** — file-level, cited above (evidence items 1–2).
- **Focused suites at head** — `packages/plugin-streams-core` tests: 16 passed / 0 failed.
  Gate-side selector/example/trace tests: 8 passed / 0 failed. Real-server proxy conformance
  (`plugins/streams/services/src/sse-contract_conformance_test.ts`) and copy-exact docs example
  test: 2 passed / 0 failed.
- **Full core export-map doc lint** — `deno doc --lint mod.ts src/sse/mod.ts src/telemetry/mod.ts
  src/testing/mod.ts`: exit 0, zero diagnostics (baseline red of 5 `private-type-ref` from
  PLAN-EVAL is fixed; the instrumentation now exposes explicit structural ports instead of leaking
  `@netscript/telemetry` internals).
- **Fresh `./streams` 11-diagnostic claim** — reproduced: exactly 11 `private-type-ref` at head
  and exactly 11 on the untouched pre-slice tree (`packages/fresh/src/runtime/streams/` identical
  to `origin/main`). Slice contribution: zero, as claimed.
- **`quality:gate`** — exit 0 at head. **`arch:check`** — exit 0, carried WARN/INFO inventory
  only. **`deno publish --dry-run`** (plugin-streams-core) — success, no slow-type diagnostics.
- **Hygiene** — no `deno-lint-ignore`, `as unknown as`, `@ts-ignore`/`@ts-expect-error`, or `any`
  added anywhere in the diff outside `.llm/runs/**` (the pre-existing quality-allowed cast in
  `plugins/workers/streams/producer.ts:52` is untouched baseline).
- **Debt** — `arch-debt.md` unchanged; AP-13 console-warn reporting and streams connector
  convergence are cited in `worklog.md` (rows 78–79, 205) and in the PR body; neither is deepened
  (no new `console.warn` in the producer diff; the generated island moved onto the versioned
  authority while the StreamDB factory debt remains separately owned).
- **Single authority** — server emission conformance, Fresh helper
  (`createNetScriptStreamEventSourceV1` → `bindStreamEventSourceV1`), generated stub
  (`consumer.stub.ts` now imports the NetScript helper instead of raw `@durable-streams/state/db`
  consumption), and the docs example all derive from `@netscript/plugin-streams-core/sse`. The
  docs example was rewritten onto the versioned binding and is extracted verbatim and executed
  against the real generated service (run 1) plus copy-exact/type-checked at head. No surviving
  parallel event-name or payload table found.
- **Process** — PLAN-EVAL PASS preceded S1 (22:10Z vs 22:17Z); design checkpoint in `worklog.md`;
  two `EXPENSIVE-GATE-REQUEST` entries precede the two serialized grants; per-slice PR comments
  form a complete commit trail; `agentic:review-threads` re-run: PASS, 0 threads / 0 unanswered;
  leak-check bracketing recorded with only the foreign `redis-jfgcbtaf` survivor, untouched.
- **PLAN-EVAL follow-ups honored** — F1: `StreamSseReplayStateV1` carries `lastObservedCursor`
  and offsets are documented as opaque never-parsed tokens; F2: the consumer span host is the
  Deno-side gate consumer, recorded in the runtime evidence.

## Acceptance rows

| # | Row | Verdict |
| - | --- | ------- |
| 1 | Exported versioned schema for every event/payload | **Proven** (contract module, 16 tests, clean full export doc lint — re-run) |
| 2 | Server/generated/Fresh/docs derive or conform | **Proven** (real-server proxy conformance re-run; stub/helper/docs on the authority) |
| 3 | Official example works unchanged against a real service | **Proven** (run 1 gate PASS; surface unchanged since — F3) |
| 4 | Replay/ordering/batching/deletion/reconnect/malformed documented | **Proven** (exported JSDoc + docs example + tests; provenance narrowings disclosed and acceptable — deletion via real test-server + verbatim example, malformed via parser with live committed offset) |
| 5 | Data carries correlation + W3C context | **Proven** (per-write `StreamWriteContextV1`, header injection, conformance) |
| 6 | One correlated producer→stream→consumer Aspire trace | **Not proven here — legitimately split to #1398**; TC-14 retained as its acceptance test |
| 7 | Contract tests fail on drift | **Proven** (negative fixtures + conformance, re-run) |
| 8 | Complete shapes in task and reference API docs | **Proven** (README/JSDoc/doc-lint; 11=11 Fresh baseline reproduced) |

## Closing keyword

`Closes #1329` is correct. All eight acceptance boxes on the live issue are checked with linked
evidence; row 6 is checked as an explicitly annotated split, not silently claimed, following the
owner-ratified #1202 pattern with the orchestrator's authority disclosure and reversal path on the
PR. The split does not conceal a defect in this slice — the missing execution publication is a
verified product gap with its own correctly-scoped issue, milestone, and acceptance test. If the
owner reverses the pattern's extension, the recorded fallback (revert to `Refs #1329`, untick
row 6) is already stated on the PR and nothing in this verdict depends on which way that ruling
goes.

## Correction review — 75832db58

**Verdict: PASS** — focused re-review of commit `75832db58` (`test(e2e): defer Flow-B trace gates
to 1398`), the new branch head, by the same separate Claude · Fable 5 session on 2026-08-09. Prior
findings stand. Tests were re-run in a detached scratchpad worktree at `75832db58` (removed after).

### Can the machinery hide a failing gate? No — by construction.

Deferral is strictly a **definition-time** decision, not a runtime transition:

- A `DeferredGate` exists only in `suite.deferredGates`; the two gates were **removed from
  `RUNTIME_GATES`** (`capability-suites.ts`), so `buildExecutionPlan` cannot select them —
  `execution-plan-builder.ts` returns only `suite.gates`, and a targeted
  `gates <suite> <deferred-id>` invocation **throws** `Unknown gate …` rather than silently
  no-oping.
- An executed gate's verdict comes only from `runGate`: `executeGate` yields `passed`/`failed`,
  and the only executed-path `skipped` is the pre-existing `skipUnsupportedPlatform`, decided
  **before** execution starts. There is no code path that converts a started or failed
  `StepResult` into a deferred/skipped one.
- `ok: failed === 0` and `summary.passed` count only `verdict === 'passed'` steps
  (`suite-runner.ts:124-136`); the synthesized deferred step is `verdict: 'skipped',
  critical: false` and lands in the separate `summary.skipped` counter. A failing gate stays
  `failed` and fails the suite; a deferred gate can never inflate `passed`.

The residual risk is definitional, not mechanical, and is recorded as F-C2 below.

### Findings by severity

No blocking findings.

- **F-C1 (low, visibility)** — `PrettyReporter` prints per-step `> <gateId>: DEFERRED #1398: …`
  and a `SKIPPED 0ms` verdict line, but its one-line aggregate prints only
  `Summary: passed=X failed=Y` — `summary.skipped` is omitted from the pretty summary line
  (pre-existing format; `pretty-reporter.ts` untouched by this commit; the JSON/report-file
  reporters carry `summary.skipped`). A human scanning only the final line sees no hint of the
  two deferrals. Suggest adding `skipped=` to the pretty summary when #1398 restores the gates or
  in a trivial follow-up. Not blocking: the deferral is unmistakable at step level and in the
  structured report.
- **F-C2 (low, re-enablement contract scope)** — The pin test
  (`suite-registry_test.ts` "runtime suites pin the exact #1398 OTEL deferral without widening
  it") locks the **runtime tiers'** deferred set to exactly the two entries and asserts neither
  suite executes a deferred gate; widening `SCAFFOLD_RUNTIME_DEFERRED_GATES` or re-adding the
  gates without clearing the deferral fails it, and restoring the gates to `RUNTIME_GATES` breaks
  the `false` membership assertions — a deliberate, test-breaking edit either way, satisfying
  #1398's re-enablement contract. However, nothing pins *other* suites to an empty
  `deferredGates`: a future PR could defer a gate on a different suite without failing this test.
  Partially mitigated — doing so requires an explicit reviewed source edit removing the gate from
  that suite's gate list, other registry tests pin specific gate membership per suite, and the
  DEFERRED step is emitted in output. Worth a global "only these suites may carry deferrals"
  assertion when the machinery is next touched.
- **F-C3 (informational)** — `validate-flow-b-traces.ts` differs from the previously evaluated
  head `371e4ba0a`, but the change is main's #1393 refactor (commit `61ae765c7`, already merged)
  arriving via merge `25359637c`: telemetry-query plumbing moved to the shared
  `aspire-dashboard-telemetry.ts` helper; the TC-14 assertions and diagnostics are unchanged.
  `select-flow-b-stream-change.ts`, `consume-flow-b-stream.ts`, and both focused test files are
  byte-identical to the evaluated head (`git log 371e4ba0a..75832db58` touches none of them;
  re-ran the focused suite: 7 passed / 0 failed, both TC-14 negatives still assert throws).

### Checks performed

1. **Deferral visibility** — distinguishable on all three axes: from a **pass** (verdict
   `skipped`, title prefixed `DEFERRED #1398:`, structured
   `{status:'deferred', issue, reason}` evidence, counted in `summary.skipped` not
   `summary.passed`); from **absence** (a never-registered gate emits nothing; deferred gates
   emit `gate-start`/`gate-end` events and a report step). The emission lives in the production
   `createSuiteRunner.run` loop (`suite-runner.ts:76-87`), unconditional for every full-suite
   run on any reporter — the unit test drives that same production function, and the
   materialization path (`createScaffoldCapabilitySuite` → `resolveSuite` → `builtInSuites`)
   carries `deferredGates` into the real CLI registry.
2. **Fail/skip semantics** — verified above; no red-hiding transition exists.
3. **No weakening of unrelated gates** — commit touches exactly 6 files; the
   `capability-suites.ts` hunks remove only the two OTEL lines and add the deferral wiring.
   `RUNTIME_SQLITE_GATES` derives by filter from `RUNTIME_GATES`, so both tiers defer
   consistently. The W2-A/W2-C gates are intact at head: the KV runtime waits
   (`KV_BACKGROUND_RUNTIME_WAIT_RESOURCES` map), `database.migration-artifacts`, both
   `runtime.capture-db-allocation-*`, and `behavior.live-db-endpoint` all remain in the gate
   lists with unchanged ordering/criticality. Full re-run: `suite-registry_test` +
   `suite-runner_test` + `runtime-gates_test`: 41 passed / 0 failed; the gates test directory
   (incl. `scaffold-gates_test.ts`, `verify-live-db-endpoint_test.ts`,
   `aspire-dashboard-telemetry_test.ts`): 57 passed / 0 failed.
4. **Re-enablement contract** — pinned and test-breaking in both directions (F-C2 for the scope
   caveat).
5. **Implementation untouched** — verified byte-identical except the main-side #1393 plumbing
   refactor (F-C3).
6. **Hygiene** — zero `deno-lint-ignore`, `as unknown as`, `@ts-ignore`/`@ts-expect-error`, or
   `any` added by `75832db58` outside `.llm/runs/**`. The disclosed type-widening correction is
   genuine narrowing, not a cast: the test uses `kind: 'summary' as const` (const assertion —
   literal self-narrowing only) and `SCAFFOLD_RUNTIME_DEFERRED_GATES` uses
   `as const satisfies readonly DeferredGate[]`, which preserves literal types under a checked
   constraint. `deno check --unstable-kv` over the three touched source files: clean.
