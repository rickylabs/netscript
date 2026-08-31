# Research — #1592 typed worker execution progress (Slice 1: persist + publish)

## The existing architecture already generalizes cleanly — confirmed by reading the real code

`packages/plugin-workers-core/src/state/execution-state.ts`'s `KvExecutionState` has a private
`#transition(executionId, updates: Partial<ExecutionRecord>)` helper, already used identically by
three public methods:

```ts
queue(executionId)   -> #transition(executionId, { status: 'queued' })
start(executionId)   -> #transition(executionId, { status: 'running', startedAt, workerId })
complete(executionId, options) -> #transition(executionId, { status, completedAt, duration, ... })
```

`#transition` calls the private `#save`, which **persists to KV and unconditionally invokes the
mutation hook** (`this.#onMutation?.({ type: 'updated', execution: record })`). That hook, set via
the already-public `setMutationHook()`, is exactly what
`createStreamMutationHook()` (`streams/producer.ts`) wires to `producer.upsert('execution',
toExecutionStreamEntity(execution))` — the **same generic publish pipeline** every existing status
transition already uses. **Adding a `progress()` method following this identical pattern requires no
new publish plumbing at all** — persistence and durable-stream publication both happen automatically
through machinery that already exists and is already exercised by `queue`/`start`/`complete`.

## The four places a progress field must be threaded

1. **`packages/plugin-workers-core/src/domain/job-definition.ts`** — `ExecutionRecordShape` /
   `ExecutionRecordShapeValue` / `ExecutionRecordSchema` / the `ExecutionRecord` type. Add
   `progressPercent: number | null` and `progressMessage: string | null` (nullable, not optional —
   matching the existing convention for fields like `startedAt`/`error`/`result`, which are all
   `.nullable()` rather than `.optional()`).
2. **`packages/plugin-workers-core/src/state/execution-state.ts`** — add
   `progress(executionId: string, percent: number, message?: string): Promise<ExecutionRecord | null>`
   calling `this.#transition(executionId, { progressPercent: percent, progressMessage: message ??
   null })`, in the exact style of `queue`/`start`/`complete`.
3. **`packages/plugin-workers-core/src/streams/schema.ts`** — `WorkerExecution` type and its Zod
   companion schema (`WorkerExecutionShape`/`WorkerExecutionSchema` — read the surrounding code for
   the exact Zod-shape-mirroring pattern already used for every other field).
4. **`packages/plugin-workers-core/src/streams/producer.ts`** — `WorkerExecutionRecord` type and
   `toExecutionStreamEntity()`'s field mapping.

## What Slice 1 does NOT include — genuinely deferred, not silently dropped

**The runtime wiring from `ctx.reportProgress()` (called from inside a running job) to
`ExecutionState.progress()` was searched for and not found.** `WorkerOutboundMessage`/
`JobProgressMessage` (`runtime/messages.ts`) already model a `'progress'` message type, but neither
`job-dispatcher.ts` nor `in-process-job-runner.ts` contains any code that reads or acts on an
outbound message of any kind — the message protocol type exists without a consumer. Whether jobs run
fully in-process (in which case `reportProgress` could call `ExecutionState.progress()` directly, no
IPC needed) or whether a message-passing boundary genuinely exists between a running job and the
dispatcher was not conclusively determined within this research pass.

**This is Slice 1 of #1592, not the whole issue.** It makes persisting and publishing a progress
transition possible and provably correct, using the exact machinery every other transition already
uses — but it does not yet make `ctx.reportProgress()` actually call it. That wiring, and the
issue's "document ordering/coalescing and replay behavior" requirement (which — given durable-stream
upserts are full-record replaces with normal append-log replay semantics, identical to how every
other status field already survives replay — likely needs no special handling beyond what already
exists, but this should be confirmed once the runtime wiring is understood) are follow-up work.

## Explicitly out of scope

No change to `runtime/messages.ts`, `job-dispatcher.ts`, `in-process-job-runner.ts`, or any
worker-runtime message-passing code. No change to `ctx.reportProgress()`'s existing (currently unused)
declarations in `job-context.ts`/`runtime-types.ts`/`public/root.ts`.
