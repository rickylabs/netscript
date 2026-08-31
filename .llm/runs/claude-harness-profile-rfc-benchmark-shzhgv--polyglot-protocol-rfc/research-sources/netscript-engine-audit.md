# NetScript Engine Audit — RFC-5 (Polyglot Task Protocol)

Read-only audit of the polyglot dispatch engine as of 2026-08-20 (branch state in
`/home/user/netscript`). All citations are `file:line` against the working tree.

---

## 1. The polyglot dispatch contract today

### 1.1 Where TASK_ID / TASK_PAYLOAD is built

- **Queue-driven tasks** — `processWorkerTask` builds the entire foreign-task input contract
  inline at `plugins/workers/worker/job-dispatcher.ts:234-240`:

  ```ts
  const result = await context.taskExecutor.execute(taskDef, {
    env: {
      TASK_ID: taskId,
      ...(payload ? { TASK_PAYLOAD: JSON.stringify(payload) } : {}),
    },
    timeout: taskDef.timeout,
  });
  ```

  That is the whole options object: **no `correlationId`, no `traceparent`, no `tracestate`, no
  `signal`, no `attempt`** — even though `TaskMessage` carries `correlationId`, `traceparent`,
  `tracestate` (`packages/plugin-workers-core/src/runtime/runtime-types.ts:169-182`) and
  `TaskExecutionOptions` has first-class fields for all of them
  (`packages/plugin-workers-core/src/executor/executor-types.ts:60-73`).

- **Polyglot jobs** (`executionType != 'deno'`) — `executePolyglotTask` builds `JOB_ID` /
  `JOB_PAYLOAD` env plus TRACEPARENT/TRACESTATE at `plugins/workers/worker/job-execution.ts:155-175`.
  Trace context IS forwarded here (both as options and env, lines 167-173), but `correlationId` is
  **not** passed — `executeWorkerJob` receives it (`job-execution.ts:18`) and drops it on the
  polyglot branch (`job-execution.ts:24`).

- Task file stubs consume the contract: python/shell/powershell stubs echo argv/env JSON
  (`plugins/workers/src/adapter/resources/task/task.stub.ts:27-60`).

### 1.2 Consumption path

- `startTaskQueueListener` listens on queue `'tasks'` and calls `processWorkerTask`
  (`plugins/workers/worker/queue-consumer.ts:50-73`). `taskQueue.listen(..., { signal })` — **no
  per-task concurrency option** (contrast the job trigger listener, which passes
  `concurrency: config.concurrency ?? 1`, `queue-consumer.ts:131`).
- HTTP enqueue: `triggerTask` handler builds the `TaskMessage` (`triggeredBy: 'api'`, payload,
  priority, correlationId, delay) and enqueues to the tasks queue
  (`plugins/workers/services/src/routers/tasks.ts:46-84`).
- `processWorkerTask` lifecycle (`job-dispatcher.ts:192-283`): registry lookup + enabled check
  (207-208) → idempotency claim (210-220) → `executionState.create({concept:'task', ...})`
  (222-229, forwards `correlationId` **into the record** but not into the subprocess) →
  `start` (232) → execute (234-240) → `complete` with
  `status: success ? 'completed' : 'failed'`, `exitCode`, `result`, `error` (246-251).

### 1.3 Executor chain

- `MultiRuntimeTaskExecutor.execute`
  (`packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:77-114`): resolves the
  adapter from `customAdapters[task.type]` or the built-in map (116-122), resolves options —
  `env: { ...task.env, ...options.env }`, `timeout: options.timeout ?? task.timeout ?? 300000`
  (124-135, default at 66) — and wraps in an OTel span. Adapter registry:
  deno/python/dotnet/shell/powershell/cmd/executable (`multi-runtime-task-executor.ts:195-205`).
- `RuntimeAdapterBase.execute`
  (`packages/plugin-workers-core/src/executor/adapters/runtime-adapter-base.ts:46-58`): builds the
  argv spec, merges `env: { ...options.env, ...spec.env }`, delegates to `DaxProcessRunner`.
  Pre-spawn failures return `failedTaskResult` — `exitCode: -1`, `attempt: 0`
  (`runtime-adapter-base.ts:62-79`).

### 1.4 DaxProcessRunner — env merge, trace conditionality (D-4), parsing, timeout

`packages/plugin-workers-core/src/executor/adapters/dax-process-runner.ts`:

- **Env merge** (`buildEnvironment`, :89-98):

  ```ts
  { ...Deno.env.toObject(), ...task.env, ...options.env,
    ...(options.traceparent ? { TRACEPARENT } : {}),
    ...(options.tracestate ? { TRACESTATE } : {}),
    ...(options.correlationId ? { CORRELATION_ID } : {}) }
  ```

  TRACEPARENT / TRACESTATE / CORRELATION_ID are **conditional on options fields that the task
  dispatch path never sets** (§1.1) — this is the D-4 drop: the mechanism exists at the runner but
  is starved upstream. Note also the runner inherits the **entire parent process env**.

- **Spawn**: dax template with `cwd`, `.env(env)`, `.timeout(\`${timeout}ms\`)`, `.noThrow()`,
  piped stdout/stderr (:52-57). Abort pre-check only (:39-49) — a signal that fires **after** spawn
  is never observed; the subprocess is not killed on abort.
- **Streaming**: line-buffered decode of both streams into in-memory arrays with `onLog`/
  `onStdout`/`onStderr` callbacks and severity classification (:100-150). Unbounded buffering —
  huge stdout is held fully in memory, joined (:161), stored on the result, and (on failure)
  copied into the ExecutionRecord (see §1.5).
- **Timeout/kill**: dax's `.timeout()` kills the child and throws; the catch block classifies by
  string sniff `message.toLowerCase().includes('timeout')` → status `'timeout'`, `exitCode: -1`
  (:82-86). No grace/SIGTERM-then-SIGKILL semantics, no partial-output preservation guarantee.
- **`parseJsonLastLine`** (:178-189): takes `stdout.trim().split('\n').pop()`; empty stdout →
  `null`; JSON parse failure → silently `null`; parsed arrays/primitives → `null`; **any JSON
  object on the last stdout line becomes `result`** — unvalidated, no sentinel/marker, so a log
  line like `{"level":"info",...}` is hijacked as the task result.
- **Result assembly** (`createProcessResult`, :152-176): `success = exitCode === 0`; error message
  built from exit code + first stderr line under 200 chars (:191-197); `attempt: 0` hardcoded
  (:174).

### 1.5 What lands in ExecutionRecord, via which persistence hook

- Record shape: `packages/plugin-workers-core/src/state/execution-state.ts:35-78` (`exitCode`,
  `duration`, `error`, `result`, `attempt`, `maxAttempts`, `correlationId`, `traceparent`,
  `tracestate`).
- `KvExecutionState.create` persists under KV prefix `['workers','executions']` with
  `attempt: 0` fixed (:153-179, prefix at :8); `complete()` computes `duration` from
  `startedAt` wall clock — **not** the runner's measured `result.duration` — and defaults
  `exitCode` to 0/1 (:196-212). Every mutation is validated by `ExecutionRecordSchema.parse`
  (:325-327) and re-emitted through `#save` → `#onMutation` hook (:304-308).
- The persistence/streaming hook is `setMutationHook(createStreamMutationHook())`, wired in
  `plugins/workers/bin/runtime.ts:92,131` and `plugins/workers/services/src/main.ts:67`; the hook
  mirrors each record into the durable stream `'/workers/executions'` via
  `createDurableStream` (`packages/plugin-workers-core/src/streams/producer.ts:69-130`,
  plugin wrapper `plugins/workers/streams/producer.ts:49-53`).
- On the task path, `processWorkerTask` writes `exitCode: result.exitCode ?? (success?0:1)`,
  `result`, `error` (`job-dispatcher.ts:246-251`) — the runner's `'timeout'`/`'cancelled'`
  statuses are collapsed to `'failed'` (247) even though `CompleteExecutionOptions` supports
  `'timeout'` (`execution-state.ts:113`). On the polyglot-job path, failure diagnostics stuff raw
  `stdout` + `stderr` into `result` (`job-execution.ts:179-190`).

## 2. JS-side citizenship surface (the contrast)

- `JobContext` gives in-process Deno handlers: `id`, `job`, `payload`, `correlationId`,
  `traceparent`, `tracestate`, `reportProgress`
  (`packages/plugin-workers-core/src/runtime/runtime-types.ts:23-31`; domain twin
  `src/domain/job-context.ts:11`; public re-export `src/public/root.ts:137`).
- `WorkerPool.executeJob` populates all of it from the `JobMessage` and wires `reportProgress`
  to a pool-level callback (`plugins/workers/worker/job-runner-pool.ts:46-65`).
- **Progress events today go to console.log only**: the sole `setProgressCallback` consumer is
  `worker.ts:163-169`. They are not persisted, not streamed, not exposed over SSE — progress is a
  JS-only, ephemeral affordance. Foreign tasks have no equivalent at all.
- Telemetry helper `job-tools` forwards to `ctx.reportProgress`
  (`packages/plugin-workers-core/src/telemetry/job-tools.ts:46`).

## 3. oRPC + zod surface of the workers plugin

- Contracts live in `packages/plugin-workers-core/src/contracts/v1/` (definition, schemas, types,
  contract) and are re-exported by `plugins/workers/contracts/v1/mod.ts:10-26`.
- Router assembly: `assemblePluginContractRouter` binds `workersV1` handlers under namespace
  `workers`/`v1` (`plugins/workers/services/src/router.ts:11-18`); handlers in
  `plugins/workers/services/src/routers/{jobs,tasks,runs,subscribe,admin,describe}.ts`.
- Input validation is oRPC-native: e.g. `TaskTriggerInputZodSchema` — `payload` is
  `z.record(z.string(), z.unknown()).optional()`
  (`packages/plugin-workers-core/src/contracts/v1/workers.contract-schemas.ts:237-247`), output
  `triggerTaskOutput` (:284) bound at the contract (:502-505).
- **No per-task payload/result schemas exist anywhere.** `TaskDefinitionSchema`
  (`packages/plugin-workers-core/src/domain/task.ts:177-179`, shapes :120-174) has `args`, `env`,
  `permissions`, `inlineScript` … but no `payloadSchema`/`resultSchema` field. Registry writes
  parse the *definition* (`registry/kv-task-registry.ts:100`), the queue trigger path can validate
  *job* messages when a `config.schema` is supplied (`queue-consumer.ts:102-113`), but the task
  payload crossing the process boundary and the JSON parsed back from stdout are both unvalidated.
- SSE: `subscribe` handler yields typed events (`SSEEventSchema`, contract-schemas.ts:249-252;
  handler `plugins/workers/services/src/routers/subscribe.ts:11-50`).

## 4. Auth plugin port/adapter architecture (the blueprint to copy)

- **Core package** `packages/plugin-auth-core/src/` with doctrine folders:
  `domain/ ports/ contracts/ config/ presets/ public/ streams/ telemetry/ testing/`.
- **Ports** (`src/ports/mod.ts`): one composite adapter contract `AuthBackendPort` (:212-241)
  aggregating narrow capability ports — `AuthProviderRegistryPort` (:74-82),
  `AuthSessionStorePort` (:85-94), `AuthSessionCryptoPort` (:97-102), `AuthPrincipalMapperPort`
  (:206-209), optional capability `interactive?: InteractiveFlowPort` (:125-134, :238).
- **Capability boundaries are typed errors**, not silent nulls:
  `AuthBackendOperationUnsupportedError` (:147-163), `AuthBackendNotFoundError` (:244-258).
- **Registration** is a plain named registry resolved at the app composition root:
  `AuthBackendRegistry = Map<string, AuthBackendPort>` + `createAuthBackendRegistry` /
  `resolveBackend` with `DEFAULT_AUTH_BACKEND_NAME = 'default'` (:317-355). Core also ships shared
  default implementations adapters can reuse (`createHmacSessionTokenCrypto`, :182-203).
- **Adapter packages** are siblings named `auth-<vendor>`: `packages/auth-better-auth/src/`
  (`better-auth-backend.ts` implements `AuthBackendPort`), `packages/auth-kv-oauth/src/`
  (backend + flow/store/crypto split), `packages/auth-workos/src/` (authenticator + backend).
  Adapters import ports **only** from `@netscript/plugin-auth-core`; the plugin
  (`plugins/auth/`) wires registry + services.
- **RFC-5 mapping (owner directive)**: `plugin-workers-core` keeps the protocol ports (e.g.
  `TaskTransportPort` / `TaskEnvelopeCodec` / capability discovery), sibling packages
  `workers-<runtime>` (mirroring `auth-<vendor>`) implement them, a named registry with a
  `'default'` key selects transports at the composition root, and unsupported capabilities throw a
  typed `...OperationUnsupportedError` instead of degrading silently. The current
  `TaskRuntimeAdapterLike` map (`multi-runtime-task-executor.ts:195-205`) is the seam to
  generalize.

## 5. Ecosystem seams a foreign task would need (minimal API inventory)

| Capability | Today's JS-side API | Location |
| --- | --- | --- |
| Enqueue task/job | `createQueue<TaskMessage>('tasks').enqueue(msg, {delay,priority})` | `plugins/workers/services/src/routers/tasks.ts:66-84`; queue surface `packages/queue/mod.ts:49-104` |
| Trigger via HTTP | oRPC `triggerTask`/`triggerJob` (`/v1/workers/...`) | `workers.contract-schemas.ts:237-247`, routers/tasks.ts |
| Trigger→job bridge | triggers runtime enqueues `JobMessage` to `'jobs'` | `plugins/triggers/src/runtime/trigger-runtime-processor.ts:74,344`; trigger stores/ports `packages/plugin-triggers-core/src/public/mod.ts` |
| KV | `getKv()` (used directly by workers SSE) | `plugins/workers/services/src/routers/subscribe.ts:7,16` |
| Durable stream publish | `createDurableStream({streamPath,schema,producerId})` | `packages/plugin-workers-core/src/streams/producer.ts:72-76`; core `packages/plugin-streams-core/src/application/create-durable-stream.ts` |
| Stream consume (UI/SSE) | workers SSE `subscribe` + durable stream `/workers/executions` | subscribe.ts:11-50; producer.ts:6 |
| Sagas | `defineSaga/defineSignal/defineQuery`, `send/spawn/schedule/sagaComplete...` | `packages/plugin-sagas-core/src/public/mod.ts:10-44` |
| Execution status readback | `KvExecutionState.get/listBy*` + oRPC runs routes | `execution-state.ts:214-261`; routers/runs.ts |
| Progress | `ctx.reportProgress` (JS only, console-only sink) | runtime-types.ts:30; worker.ts:163 |

An RFC-5 ecosystem-access surface must cover, at minimum: enqueue (task/job/saga signal), KV
get/set scoped access, durable-stream publish, progress/heartbeat reporting, and execution-status
query — all currently reachable only from Deno in-process code.

## 6. Defect register

| # | Defect | Location | Fix direction |
| --- | --- | --- | --- |
| D-1 | **D-4 lineage (task path)**: `processWorkerTask` passes only `env` + `timeout`; `correlationId`/`traceparent`/`tracestate`/`signal` from `TaskMessage` never reach `TaskExecutionOptions`, so DaxProcessRunner's conditional TRACEPARENT/TRACESTATE/CORRELATION_ID injection (dax-process-runner.ts:94-96) is dead on this path | `plugins/workers/worker/job-dispatcher.ts:234-240` | Forward message trace/correlation fields (and an abort signal) into the execute options; make the envelope explicit in RFC-5 |
| D-2 | **D-4 lineage (polyglot job path)**: `executeWorkerJob` drops `correlationId` when branching to `executePolyglotTask` — trace headers forwarded, CORRELATION_ID not | `plugins/workers/worker/job-execution.ts:24,130-175` | Thread `correlationId` through and set it in `execOptions` |
| D-3 | **Stdout hijack**: last stdout line that parses as a JSON object silently becomes the task `result`; no sentinel, no schema | `dax-process-runner.ts:171,178-189` | Replace with a framed/sentinel result channel (RFC-5 envelope) or dedicated fd/file; never scavenge logs |
| D-4 | **Unvalidated fallback parse**: parsed result is stored into ExecutionRecord and streamed with zero zod validation; `TaskDefinitionSchema` has no `payloadSchema`/`resultSchema` | `dax-process-runner.ts:178-189`; `packages/plugin-workers-core/src/domain/task.ts:120-179` | Add optional per-task payload/result schemas to the registry and validate at both boundary crossings |
| D-5 | **attempt never propagated**: `TaskResult.attempt` hardcoded 0 (both success and failure paths); `ExecutionRecord.attempt` created at 0 and never incremented; `maxRetries` is stored but no dispatcher retry loop exists | `dax-process-runner.ts:174`; `runtime-adapter-base.ts:77`; `execution-state.ts:170` | Carry `attempt` in the message/options, increment on retry, expose ATTEMPT to the subprocess |
| D-6 | **Post-spawn abort ignored**: signal is checked only before spawn; an abort during execution neither kills the child nor cancels the run | `dax-process-runner.ts:39-49` | Wire `options.signal` to child kill (dax `.signal()` or manual abort listener) |
| D-7 | **Timeout classified by string sniff**: `'timeout'` inferred from error message text; job-level twin does the same | `dax-process-runner.ts:84`; `job-dispatcher.ts:315` | Detect dax `TimeoutError` by type / use explicit deadline bookkeeping |
| D-8 | **Timeout status collapsed on persist**: task completions record `'failed'` even when runner status is `'timeout'`/`'cancelled'`, though `CompleteExecutionOptions` supports `'timeout'` | `job-dispatcher.ts:247`; `execution-state.ts:113` | Map `result.status` through to `complete()` |
| D-9 | **Full parent env inherited by every subprocess**: `Deno.env.toObject()` is the env base, leaking supervisor secrets to foreign tasks regardless of `permissions.env` | `dax-process-runner.ts:91` | Start from an allowlisted base env; make inheritance opt-in per task |
| D-10 | **Unbounded stdout/stderr buffering**: all lines are held in memory, joined, and (on failure) copied into `result` diagnostics → KV + durable stream | `dax-process-runner.ts:35-36,161-167`; `job-execution.ts:179-190` | Cap buffers (head/tail), persist overflow to blob storage, keep record small |
| D-11 | **`maxConcurrency` stored but never enforced**: schema default 1 (`task.ts:160`), generators hardcode 1 (`runtime-registry-generator.ts:335`), yet neither `MultiRuntimeTaskExecutor` nor the task queue listener reads it — task listener passes no concurrency at all | `queue-consumer.ts:57-69`; `multi-runtime-task-executor.ts:77-114` | Enforce per-task concurrency at the listener/executor (semaphore keyed by task id) or delete the field |
| D-12 | **Progress is console-only, JS-only**: `reportProgress` events terminate at `console.log`; nothing persists/streams them, and foreign tasks have no progress channel | `plugins/workers/worker/worker.ts:163-169`; `job-runner-pool.ts:61-63` | Route progress through the execution mutation hook / durable stream; add a progress verb to the RFC-5 protocol |
| D-13 | **Task `success` derived only from exit code 0** and error truncated to the first stderr line <200 chars, losing structured failure info from runtimes with meaningful nonzero codes | `dax-process-runner.ts:72,191-197` | Protocol-level result envelope with explicit ok/error payload; keep exit code as transport metadata |
| D-14 | **`complete()` recomputes duration from KV timestamps**, discarding the runner-measured `result.duration` (skew when state writes lag) | `execution-state.ts:202-207`; `job-dispatcher.ts:246-251` | Accept an optional measured duration in `CompleteExecutionOptions` |
