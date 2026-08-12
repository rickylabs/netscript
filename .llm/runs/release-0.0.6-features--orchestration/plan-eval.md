# PLAN-EVAL — #1398 (verbatim verdict)

| Field | Value |
| --- | --- |
| Phase | PLAN-EVAL |
| Subject | `plan.md` for issue #1398 |
| Evaluator | MiniMax M3 · high, `claude-evaluator-minimax-m3` preset over OpenRouter |
| Session | fresh, separate from the generator; worktree `/home/codex/repos/ns006-1398-planeval` @ `01aeafbfa` |
| Route reason | local fallback per `drift.md` D-2 (#1524 still open) |
| Duration |  ms |
| is_error | False |
| Raw stream | `plan-eval-raw.md` (215 events) |

A leaked one-line preamble ("Now I have enough to write the verdict…") preceded the verdict token in
the raw stream and is stripped here; nothing else is edited.

---

**[PHASE: PLAN-EVAL] [VERDICT: PASS]**

Plan is sound and the causal chain holds; one unresolved open decision worth flagging before implementation.

### Verified

- **Trace id chain** — `plugins/workers/worker/job-dispatcher.ts:43-44` (`parentContext = tracedContext?.parentContext ?? getParentContextFromHeaders(traceHeaders)`) → `:108` (`traceJobExecution({...,parentContext}, ...)`) → `packages/telemetry/src/instrumentation/worker.ts:323-385` (`withSpan(tracer, ..., { parentContext, ... })`) → `packages/telemetry/src/application/span.ts:38-43` (passes `parentContext` as the third arg to `tracer.startSpan`). The `job.execute` span's trace id is therefore the dispatch traceparent's trace id.
- **Ambient publish span** — `packages/plugin-streams-core/src/telemetry/instrumentation.ts:160-170` calls `this.#tracer.startSpan(StreamSpanNames.PUBLISH, { kind, attributes })` with no parent context. The `headers.traceparent` is `formatTraceparent(span.spanContext())` (line 172). The publish span's trace id is the active OTel context's trace id at the time of `startSpan`.
- **TC-14 assertion** — `packages/cli/e2e/src/application/gates/scaffold/select-flow-b-stream-change.ts:131-153` extracts the trace id from the matched record's `headers.traceparent` (regex `^[0-9a-f]{2}-([0-9a-f]{32})-...` at line 142) and asserts equality with `identity.traceId`. The comparison is trace id only, not the full `traceparent`. Plan's claim is correct.
- **Selector match semantics** — `select-flow-b-stream-change.ts:96-105` returns on the first matching `correlationId`. With D3, every record's trace id equals the dispatch traceparent's trace id, so TC-14 passes regardless of which record returns first.
- **Stored traceparent on the execution record** — `packages/plugin-workers-core/src/state/execution-state.ts:73-75` (and earlier in `create` at lines 154-175) store `traceparent`/`tracestate` from the queue message. The dispatch traceparent is identical to that stored on `create()` (since `create()` runs before `traceJobExecution` and accepts the queue's trace headers).
- **S0 — streams env reaches workers-combined** — YES. `packages/cli/src/kernel/adapters/plugin/plugin-reference-reconciler.ts:70-91` adds plugin dependencies (including `streams`) and the canonical plugin name to `backgroundReferences` for `workers-combined`. `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts:200-218` then injects `services__streams__http__0` for each plugin reference. `plugins/streams/src/public/mod.ts:45-49` registers `streams` as a service. `packages/plugin-streams-core/src/application/stream-url-resolver.ts:38` and `:108` read `services__streams__http__0` (server-side). The env path is fully wired.
- **D4 vs reality** — `traceparent`/`tracestate` are already on `ExecutionRecord` (execution-state.ts:73-75). The schema change D4 forbids is not required by D3, since D3 only reads the fields that already exist. No internal conflict.
- **D1 idempotency** — `KvExecutionState.setMutationHook` (execution-state.ts:147-149) is destructive (single `onMutation` field). If both `workers-api` and `workers-combined` independently call it, the second call replaces the first. Since both call it with `createStreamMutationHook()` (the same behavior), the only consequence is a wasted hook construction; no double-install hazard.
- **R2 record volume** — `packages/plugin-streams-core/src/domain/producer-contract-v1.ts:50-53` shows the 256-event / 1 MiB bounded buffer. Plan correctly notes this is volume, not correctness.
- **`isRecord` check in selector** — `select-flow-b-stream-change.ts:122-128` reads `value.correlationId` first. `toExecutionStreamEntity` (producer.ts:94) sets `correlationId: execution.correlationId`. ✓

### Findings

1. **F1 (advisory) — D3 mechanism is implemented by the slice, not enumerated by the plan.** The plan says "publish under an OTel context extracted from the execution record's stored `traceparent`/`tracestate`" but the existing `createStreamMutationHook` (`packages/plugin-workers-core/src/streams/producer.ts:108-118`) calls `producer.upsert(...)` with no `context.with(...)` wrapping. The `StreamsTracerPort.startSpan` interface (`packages/plugin-streams-core/src/telemetry/instrumentation.ts:92-102`) does not accept a parent context argument, so the only way for the publish span to inherit the stored traceparent's trace id is for the hook to wrap the `producer.upsert` call with `context.with(extractContext({traceparent, tracestate}), () => producer.upsert(...))`. The plan's wording is correct but the implementation step is implicit. **Slice review should confirm the implementation explicitly wraps with `context.with(...)` and adds a unit test that pins the trace id under the active context override (the plan already names this in tests #1 and #3).**

2. **F2 (advisory, scope honesty) — S2 misses a second test in `suite-registry_test.ts`.** The plan updates `suite-registry_test.ts:204-215` (the test that asserts `runtime.gates.some(...)` is false for the two gates) but **misses the second test at lines 209-234** (`runtime suites pin the exact #1398 OTEL deferral without widening it`). That test at line 210-221 asserts `SCAFFOLD_RUNTIME_DEFERRED_GATES` exactly equals the two-gate list. After D5 removes both entries, the constant becomes empty (or zero entries), and the assert fails. The test must be removed or rewritten in the same commit as the deferral-list change. **Block-level for S2's "red-on-regression" claim** — if S2 is committed without updating this test, the planned local unit-test gate (or the Tier-A review) will catch and block it. Either is the right time; the plan should name it.

3. **F3 (advisory) — The `instrumentation.ts:160` cite is correct but load-bearing.** The plan's claim that `tracer.startSpan` is called with no explicit context is critical to D3's logic. Verified directly. ✓

4. **F4 (advisory) — Promise chain does not lose the OTel context.** `executionState.create` (execution-state.ts:152-178) → `#save` (line 304-307) → `setMutationHook` callback is in a single async chain. `await this.#kv.set(...)` yields, but the active context within the resumption is the caller context (no parent span at the time of `create()`). Wrapping the hook with `context.with(extracted, ...)` works correctly across the `await` boundary because async contexts in Deno are preserved by the runtime. ✓

5. **F5 (acknowledged) — R3 undeclared `@netscript/plugin-streams-core` import in `packages/plugin-workers-core/deno.json`.** Confirmed: `deno.json` lines 24-35 do not list it, but `src/streams/producer.ts:1` imports it. If `deno publish` rejects it, the slicing is incomplete. The plan correctly defers this. Acceptable.

6. **F6 (advisory) — Selector ambiguity is correctly resolved by D3.** Four records share `correlationId`. Without D3, the first match (`create()`) fails TC-14 because its publish span has a different trace id. With D3, all four records share the trace id — so any match passes TC-14. The plan's reasoning is correct. ✓

### Answers to open questions

- **S0 (streams env reaches workers-combined)**: YES, answered. Citations: `packages/cli/src/kernel/adapters/plugin/plugin-reference-reconciler.ts:70-91` (background inherits plugin dependencies) → `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts:200-218` (env injection) → `plugins/streams/src/public/mod.ts:45-49` (service declared) → `packages/plugin-streams-core/src/application/stream-url-resolver.ts:38,108` (resolution). The plan's S0 blocker is **de-risked**; the slice can proceed without an "is this wired?" probe.

### Next

- **Slice review (Tier-A)**: when each implementation slice lands, verify (a) the hook wraps `producer.upsert` with `context.with(extractContext({traceparent, tracestate}), ...)` and the unit test pins the span trace id (F1), and (b) S2 updates both `suite-registry_test.ts:204-215` AND `suite-registry_test.ts:209-234` in the same commit (F2).
- **Implementation lane**: proceed with S1 (D1+D2+D3) and S2 (D5 + the missed test) per the plan. S3 (live E2E) is the gate. The two formerly-deferred gates must pass in a real `scaffold.runtime` run.
- **R3 undeclared import**: tracked separately, not blocking this slice per the plan.
