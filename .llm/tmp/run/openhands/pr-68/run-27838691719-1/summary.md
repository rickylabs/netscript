# IMPL-EVAL Verdict — S4 Task-OTel Bridge

**Branch**: `fix/cap-caveat-s4-task-otel`  
**Commit**: `4cc5cee3` (feat) + `a5655450` (harness artifacts)  
**Evaluator session**: `27838691719-1` (separate from implementation session)  
**Verdict**: ✅ **PASS**

---

## Summary

S4 slice merges successfully through the task-executor OTel bridge. The implementation correctly reuses `@netscript/telemetry` infrastructure (no reinvented tracer), emits spans with the claimed name and attributes (verified via in-memory exporter test), preserves existing `TaskExecutorSpan` behavior (no regression to current callers), and stays within declared scope (`packages/plugin-workers-core` only).

---

## Evaluation Results

### 1. Telemetry Reuse Pattern ✅

**Claim**: Bridge reuses `getTracer`/`withSpan` from `@netscript/telemetry`, mirroring `traceJobExec` pattern.

**Verification**:
- Executor imports: `getTracer`, `withSpan`, `Span`, `SpanKind`, `AttributeValue` from `@netscript/telemetry/tracer` ✅
- Tracer instantiation: `getTracer('@netscript/plugin-workers-core/task-executor')` ✅
- Span creation: `withSpan(tracer, WorkerSpanNames.taskExecute, async (span) => { ... }, { kind: SpanKind.INTERNAL, attributes })` ✅
- Pattern match: Identical structure to `packages/telemetry/src/instrumentation/worker.ts` L229-L286 (`traceJobExec`) ✅

**No reinvention**: The executor does not construct a custom tracer or bypass the telemetry package API.

---

### 2. OTel Span Emission Test ✅

**Claim**: Test asserts span name (`task.execute`) and key attributes via in-memory exporter.

**Verification**:
- Test file: `tests/executor/multi-runtime-task-executor_test.ts` L22-L55 ✅
- Exporter setup: `InMemorySpanExporter` + `BasicTracerProvider` with `SimpleSpanProcessor` ✅
- Assertions:
  - `spans.length === 1` ✅
  - `span.name === WorkerSpanNames.taskExecute` (resolves to `'task.execute'`) ✅
  - `span.attributes[WorkerTelemetryAttributes.taskId] === 'task.fixture'` ✅
  - `span.attributes[WorkerTelemetryAttributes.correlationId] === 'correlation.fixture'` ✅
  - `span.attributes[WorkerTelemetryAttributes.status] === 'completed'` ✅
  - `span.attributes[WorkerTelemetryAttributes.durationMs] === 12` ✅
  - `span.attributes['task.runtime'] === 'deno'` ✅
  - `span.attributes['task.executor.id'] === 'multi-runtime-task-executor'` ✅
  - `span.attributes['task.adapter.id'] === 'fake-runtime-adapter'` ✅

**Failure mode**: If `withSpan` wrapper were removed or broken, `spans.length` would be 0, causing immediate `assertEquals` failure on L41.

**Test result**: 4 passed, 0 failed (independent run confirmed).

---

### 3. In-Memory `TaskExecutorSpan` Preservation ✅

**Claim**: Existing `TaskExecutorSpan` hook behavior preserved (no regression to current callers).

**Verification**:
- `#applyInstrumentation` still calls `new TaskExecutorSpan()` at L146 ✅
- Loop over `this.#instrumentations` still invokes `instrumentation.applyTo(span, { correlationId, durationMs, status, taskId })` at L147-L153 ✅
- **Only addition**: `span.copyTo(otelSpan)` at L155 (after the loop, no mutation of existing logic) ✅
- Existing tests pass:
  - `MultiRuntimeTaskExecutor dispatches to adapter by task type` ✅
  - `MultiRuntimeTaskExecutor prefers custom adapters over built-ins` ✅
  - `MultiRuntimeTaskExecutor returns failure result for unsupported runtimes` ✅

**No breaking change**: `TaskInstrumentationLike` signature updated in `executor-types.ts` (L123-L128) to narrow `status` to `WorkerTelemetryStatus` and add optional `durationMs`, but all existing instrumentations (`TaskExecuteInstrumentation`, `WorkerStartInstrumentation`, etc.) already emit `WorkerTelemetryStatus` values and do not require `durationMs`.

---

### 4. Diff Scope & Gates ✅

**Claim**: Diff scoped to `packages/plugin-workers-core` (+ test, + harness artifacts); `deno.lock` unchanged; check/lint green.

**Verification**:
- **Changed files** (5 total):
  1. `.llm/tmp/run/cap-s4-otel/worklog.md` (harness artifact) ✅
  2. `.llm/tmp/run/cap-s4-otel/commits.md` (harness artifact) ✅
  3. `packages/plugin-workers-core/src/executor/executor-types.ts` (narrow status type, add `durationMs`) ✅
  4. `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts` (OTel bridge) ✅
  5. `packages/plugin-workers-core/tests/executor/multi-runtime-task-executor_test.ts` (OTel test) ✅
- **Lock hygiene**: `git diff origin/main..HEAD -- deno.lock` returns empty output ✅
- **Scoped check** (independent run): 102 files, 0 diagnostics ✅
- **Scoped lint** (independent run): 102 files, 0 diagnostics ✅
- **No out-of-scope changes**: No changes to `packages/telemetry`, no new dependencies in `deno.json`, no plugin manifest updates, no S1/S2/S3/S5 surfaces touched ✅

---

## Validation Evidence

| Gate | Command | Exit Code | Result |
|------|---------|-----------|--------|
| Affected tests | `deno test --no-lock --allow-all packages/plugin-workers-core/tests/executor/multi-runtime-task-executor_test.ts` | 0 | 4 passed, 0 failed |
| Scoped check | `deno run --no-lock --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --ext ts,tsx --deno-arg --no-lock` | 0 | 102 files, 0 diagnostics |
| Scoped lint | `deno run --no-lock --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-workers-core --ext ts,tsx` | 0 | 102 files, 0 diagnostics |

**Note**: Independent evaluator re-ran all gates (not relying on worklog claims).

---

## Adversarial Checks

### ✅ Span name resolution
`WorkerSpanNames.taskExecute` resolves to `'task.execute'` (verified in `packages/plugin-workers-core/src/telemetry/attributes.ts` L23). Test assertion on L43 uses the constant, ensuring the span name matches the claim.

### ✅ Attribute propagation path
1. Executor sets attributes via `withSpan` options (L90-L99) → OTel span receives them at creation.
2. `#setTaskAttributes` (L161-L171) and `#setTaskResultAttributes` (L173-L184) mutate the OTel span directly during execution.
3. `#applyInstrumentation` (L138-L156) populates `TaskExecutorSpan` (in-memory) via existing instrumentation hooks, then `span.copyTo(otelSpan)` (L155) merges in-memory attributes/events into the OTel span.
4. Test asserts both static attributes (from `withSpan` options) and dynamic attributes (from instrumentation + result).

### ✅ No double-span risk
The executor wraps the entire execution in a single `withSpan` call (L84-L103). No nested `createSpan` or duplicate tracer invocations detected.

### ✅ Error handling preserved
If `adapter.execute` throws, `failedTaskResult` catches it (L88), and `#setTaskResultAttributes` still sets `error.message` (L182). The OTel span will correctly reflect `status: 'failed'` and the error message.

---

## Remaining Risks

### 🟢 Low risk: No concerns identified

1. **Type narrowing**: `TaskInstrumentationLike.status` narrowed from `string` to `WorkerTelemetryStatus`. All existing instrumentations emit valid `WorkerTelemetryStatus` values (verified in `packages/plugin-workers-core/src/telemetry/instrumentation.ts` L77-L148). No breaking change for external plugin authors (this is a **package** archetype, not a plugin contract).

2. **Optional `durationMs`**: Added to `TaskInstrumentationLike` context (L126). Existing instrumentations do not require it, so no migration needed.

3. **Test isolation**: The OTel test uses `trace.disable()` at start and end (L23, L53), ensuring no global state leakage between tests.

---

## Recommendation

**Merge-ready**: S4 slice is implementation-complete, well-tested, and low-risk. The OTel bridge correctly reuses telemetry infrastructure, the test is adversarial (would fail without the bridge), and no regressions to existing behavior were detected.

**Next steps**:
- ✅ Merge `fix/cap-caveat-s4-task-otel` into `main`
- ✅ Close issue #68 (S4 capability caveat resolved)
- ⏸️ Await S1/S2/S3/S5 slices for full capability-caveat coverage

---

## Verdict

**✅ PASS** — Implementation matches claims. No fix required. No rescope required. No debt incurred.
