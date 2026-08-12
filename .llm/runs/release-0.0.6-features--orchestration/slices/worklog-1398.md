# Worklog — #1398 publish job executions to the durable stream

Implementation lane: Codex · GPT-5.6 Sol · medium (`normal_implementation`).
Branch: `fix/1398-publish-job-executions-to-durable-stream`.
Baseline: `origin/main@01aa12b67`.

The approved `plan.md`, `plan-eval.md`, and `slices/research-1398.md` were read from the local
orchestration branch `chore/release-0.0.6-features-orchestration` because the fresh leaf branch was
created at the shared baseline before those orchestration-only commits existed. The locked plan was
not re-decided.

## Design

- **Public surface:** no new export and no `WorkerExecutionZodSchema` change. The existing
  `WorkerExecutionRecord` type acknowledges the already-stored optional W3C trace headers.
- **Runtime state and identity:** every created, updated, and deleted execution mutation retains its
  execution id, correlation id, `traceparent`, and optional `tracestate`.
- **Ports:** `WorkersStreamProducer` remains the stream port. The core mutation hook uses
  `@netscript/telemetry/context` to make the stored W3C context ambient while that port publishes.
- **Plugin wiring:** the thin workers plugin installs the core-owned mutation hook only in the
  worker-owning background entrypoints (`startWorkerProcess` and `startCombinedProcess`). The
  scheduler does not own or mutate execution state.
- **Commit slices:** S1 installs and tests the hook/context join; S2 un-defers the two OTEL gates and
  updates both registry tests; S3 records the one-pass live `scaffold.runtime` result.
- **Deferred scope:** stream rejection reasons (#1405), undeclared stream-core imports, and worker
  execution schema changes remain out of scope.
- **Contributor path:** execution stream policy lives in
  `packages/plugin-workers-core/src/streams/producer.ts`; process wiring lives in
  `plugins/workers/bin/runtime.ts`; the adjacent stream and runtime tests are the regression map.

## S1 — mutation hook installation and trace-context join

Changed:

- `packages/plugin-workers-core/src/streams/producer.ts` wraps every mutation publication in the
  execution's extracted W3C context.
- `plugins/workers/bin/runtime.ts` installs the hook in worker-only and combined background
  processes; scheduler-only remains unchanged because its execution-state surface is reserved and
  has no mutation methods.
- `packages/plugin-workers-core/tests/streams/workers-streams_test.ts` adds stored-context and
  pre-span trace-id guards.
- `plugins/workers/tests/runtime/background-stream-hook_test.ts` spies the real combined entrypoint's
  `KvExecutionState.setMutationHook` call while suppressing worker/scheduler loops.

Gate results before commit:

| Gate | Result |
| --- | --- |
| workers scoped check | PASS — 101 files, 0 findings |
| plugin-workers-core scoped check | PASS — 111 files, 0 findings |
| workers scoped lint | PASS — 101 files, 0 findings |
| workers scoped format | PASS — 101 files, 0 findings |
| plugin-workers-core package test | PASS — 27 passed, 0 failed |
| combined-runtime installation test | PASS — 1 passed, 0 failed |
| `quality:gate` | PASS — quality scan clean; doctrine `FAIL=0` on touched roots |
| explicit plugin-workers-core quality scan | PASS — 0 findings, 0 allowances |

Negative guard evidence:

- Removing only D3 made both trace-context tests fail (exit 1): ambient trace id was retained for
  the override case and a new random trace id appeared for the pre-span case.
- Removing only the combined-process hook installation made the installation test fail (exit 1):
  actual installation count `0`, expected `1`.

Reconcile note: issue #1398 is open with milestone `0.0.6` and already carries `type:fix`,
`area:plugins`, `area:telemetry`, `priority:p1`, and exactly one lifecycle label, `status:impl`.

## S2 — restore the two OTEL runtime gates

Changed in one slice, per PLAN-EVAL F2:

- Added `behavior.otel.stream-consumer` and `behavior.otel.traces` to `RUNTIME_GATES`, which also
  carries them into the SQLite runtime tier.
- Emptied `SCAFFOLD_RUNTIME_DEFERRED_GATES` while preserving the shared explicit deferral surface.
- Flipped the main runtime-suite presence assertions to `true`.
- Rewrote the exact-deferral test to assert both runtime tiers have no #1398 deferral and execute
  both gates.

First full-package check: RED. An empty `as const satisfies readonly DeferredGate[]` inferred the
constant's element as `never`, so existing runner-test fixture code could not read `issue` or
`reason`. Fixed by declaring the empty value against the explicit `readonly DeferredGate[]`
contract; no runtime behavior or assertion was relaxed.

Second full-package test: RED with one in-scope and one unrelated failure. The in-scope failure was
a third stale #1398 pin in `suite-runner_test.ts`, which still expected two deferred skipped steps;
it now asserts zero deferrals, steps, skipped summary entries, and deferred reporter events. This
test was not named in the approved plan or PLAN-EVAL F2 and is recorded as minor factual drift. The
unrelated `quickstart-command-drift_test.ts` failure came from the package task changing cwd while
the test reads `docs/site/quickstart.vto` relative to the repository root; verify it from root and
do not absorb that task/path defect into #1398.

Final S2 evidence:

| Gate | Result |
| --- | --- |
| suite-runner + registry focused tests | PASS — 27 passed, 0 failed |
| CLI E2E test tree from repository root | PASS — 152 passed, 0 failed |
| CLI E2E scoped check | PASS — 163 files, 0 findings |
| CLI E2E scoped lint | PASS — 163 files, 0 findings |
| CLI E2E scoped format | PASS — 163 files, 0 findings |
| explicit CLI E2E quality scan | PASS — 0 findings, 0 allowances |

Negative guard evidence: temporarily removing both OTEL gates from `RUNTIME_GATES` made the main
runtime presence test and the both-tier execution test fail (exit 1, actual `false`, expected
`true`).
