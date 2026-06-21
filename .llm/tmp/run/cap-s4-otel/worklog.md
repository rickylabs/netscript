# Worklog — cap-s4-otel

Run-id: `cap-s4-otel`
Branch: `fix/cap-caveat-s4-task-otel`
Slice: S4 — task-executor OTel span export

## Design

- **Public surface:** no new public entrypoint; `MultiRuntimeTaskExecutor.execute()` keeps the same
  contract and now emits a real OTel span through `@netscript/telemetry/tracer`.
- **Domain vocabulary:** `TaskDefinition`, `ResolvedTaskExecutionOptions`, `TaskResult`,
  `TaskInstrumentationLike`, `TaskExecutorSpan`, `WorkerSpanNames.taskExecute`, and
  `WorkerTelemetryAttributes`.
- **Ports:** existing `TaskRuntimeAdapterLike` remains the execution port; existing
  `TaskInstrumentationLike` remains the package instrumentation seam. The OTel tracer is consumed
  through `getTracer()` and `withSpan()` from `@netscript/telemetry/tracer`.
- **Constants:** `TASK_EXECUTOR_TRACER_NAME` names the task-executor tracer;
  `TaskExecutorTelemetryAttributes` names executor/runtime/adapter attributes.
- **Commit slices:** one implementation slice: bridge executor instrumentation to
  `@netscript/telemetry` and prove it with an in-memory exporter test.
- **Deferred scope:** no telemetry package changes, no dependency/catalog/lock changes, no S1/S2/S3/S5
  surfaces, no executor decomposition beyond the bridge.
- **Contributor path:** extend task execution telemetry in
  `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts`; add assertions in
  `packages/plugin-workers-core/tests/executor/multi-runtime-task-executor_test.ts`.

## Files Changed

| File | Purpose |
| --- | --- |
| `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts` | Wraps supported adapter execution in `withSpan(getTracer(...), "task.execute", ...)`, mirrors task instrumentation attributes/events onto the OTel span, and preserves the existing in-memory `TaskExecutorSpan` hook behavior. |
| `packages/plugin-workers-core/src/executor/executor-types.ts` | Narrows task instrumentation status to `WorkerTelemetryStatus` and adds optional `durationMs` so final instrumentation can record duration. |
| `packages/plugin-workers-core/tests/executor/multi-runtime-task-executor_test.ts` | Adds an in-memory OTel exporter test for span name and key attributes. |

## Telemetry Bridge

The bridge reuses the existing `@netscript/telemetry/tracer` public API:

- `getTracer("@netscript/plugin-workers-core/task-executor")`
- `withSpan(..., WorkerSpanNames.taskExecute, ...)`
- `SpanKind.INTERNAL`

The existing worker-core instrumentation still receives a `TaskExecutorSpan` for `running` and final
status. When an OTel span is active, the in-memory span copies its attributes and events into that
OTel span.

## Captured Test Span

| Field | Value |
| --- | --- |
| name | `task.execute` |
| `task.id` | `task.fixture` |
| `correlation.id` | `correlation.fixture` |
| `job.status` | `completed` |
| `job.duration_ms` | `12` |
| `task.runtime` | `deno` |
| `task.executor.id` | `multi-runtime-task-executor` |
| `task.adapter.id` | `fake-runtime-adapter` |

## Gates

| Gate | Command | Result |
| --- | --- | --- |
| affected tests | `rtk proxy deno test --no-lock --allow-all packages/plugin-workers-core/tests/executor/multi-runtime-task-executor_test.ts` | PASS — 4 passed, 0 failed |
| scoped check | `rtk proxy deno run --no-lock --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --ext ts,tsx --deno-arg --no-lock` | PASS — 102 files, 0 diagnostics |
| scoped lint | `rtk proxy deno run --no-lock --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-workers-core --ext ts,tsx` | PASS — 102 files, 0 diagnostics |
| lock hygiene | `rtk git diff --stat origin/main -- deno.lock` | PASS — empty output |

DONE 4cc5cee309d50dc530ad2e47cc72981b6bf32760 — gates PASS: affected executor test, scoped check, scoped lint, lock hygiene.
