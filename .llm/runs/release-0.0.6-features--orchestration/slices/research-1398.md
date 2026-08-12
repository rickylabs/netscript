# Research — #1398 job executions never reach the durable job stream

Delegated read-only sub-agent (Claude · Opus 5, `drift.md` D-1). Baseline `origin/main@01aa12b67`.
**Terminated early on budget** after a narrow discovery pass; the unverified list below is part of
the finding, not a gap to paper over. Every claim carries a `path:line` citation from a file the
sub-agent actually read.

## Root cause — already recorded in-repo, and it is a wiring gap, not a missing feature

The stream mutation hook is installed by the workers **API service** and by nothing else:

- `plugins/workers/services/src/main.ts:67` —
  `runtime.executionState.setMutationHook(createStreamMutationHook())`, inside a `queueMicrotask`
  after `serve()`.
- The **background** entrypoints never call `setMutationHook`:
  `plugins/workers/bin/runtime.ts:89-107` (`startWorkerProcess`), `:110-122`
  (`startSchedulerProcess`), `:125-152` (`startCombinedProcess`). Each builds its own runtime via
  `createWorkersServiceRuntime()` (`plugins/workers/services/src/service-runtime.ts:80-89`, with
  `KvExecutionState` at `:84`).
- Generated projects run `startCombinedProcess()`
  (`plugins/workers/src/adapter/resources/glue/runtime.stub.ts:21-24`) as the Aspire resource
  `workers-combined` (`plugins/workers/src/aspire/workers-contribution.ts:12,56-61`).

So job **executions** run in a process whose execution-state mutations are never forwarded to the
producer. Job **definitions** are published from a different place —
`plugins/workers/services/src/init.ts:91-111` calls `emitJobToStream(...)` per job at startup, which
is exactly the three startup snapshots the issue observed. Chain:
`plugins/workers/streams/producer.ts:61-63` → `packages/plugin-workers-core/src/streams/producer.ts:122-127`
→ `producer.upsert('job', job)`. Stream path `/workers/executions`, producerId `workers-service`
(`packages/plugin-workers-core/src/streams/producer.ts:5-6,66-73`).

**The repo already says this.** The two Flow-B OTEL gates are deferred against #1398 with the reason
*"workers-combined does not install the stream mutation hook"* —
`packages/cli/e2e/suites/scaffold/capability-suites.ts:23-34`, asserted by
`packages/cli/e2e/tests/presentation/suite-registry_test.ts:204-215`. `behavior.otel.stream-consumer`
and `behavior.otel.traces` are registered (`otel-gates.ts:52-84`) but excluded from
`scaffold.runtime` / `scaffold.runtime.sqlite` via `SCAFFOLD_RUNTIME_DEFERRED_GATES`.

## Execution path and the identifiers available at completion

Webhook → triggers service → `TriggerProcessor.process` → `dispatchAction`
(`packages/plugin-triggers-core/src/runtime/trigger-processor.ts:172`, wired at
`plugins/triggers/src/runtime/trigger-runtime-processor.ts:80-82`) → `enqueueWorkerJob` (`:318-367`)
enqueues a `JobMessage` on queue `jobs` with `correlationId = event.id` (`:333`) and
`traceparent`/`tracestate` from `traceJobDispatch` (`:348-354`).

Worker consumption — `plugins/workers/worker/job-dispatcher.ts:35-175`:

| Step | Line | Note |
| --- | --- | --- |
| `executionState.create({… correlationId, traceparent, tracestate})` | `:74-83` | **before** the `job.execute` span exists |
| `traceJobExecution` creates the `job.execute` span | `:91` | |
| `executionState.start` | `:131` | inside the span context |
| `executionState.complete(executionId, {status, exitCode, result, error})` | `:165-170` | inside the span context |

`traceJobExecution` → `withSpan` (`packages/telemetry/src/instrumentation/worker.ts:295-323`;
`packages/telemetry/src/application/span.ts:32-62`) uses `context.with(trace.setSpan(...))`, so any
span started **during** the callback inherits the `job.execute` trace id.

The stored record already carries the join identifiers:
`packages/plugin-workers-core/src/state/execution-state.ts:35-78` (`traceparent` `:74`, `tracestate`
`:76`), with mutations emitted at `:288` (delete) and `:307` (`#save`, created/updated).

## The producer is already reachable — nothing needs threading

`getWorkersStreamProducer()` is a module-level singleton
(`plugins/workers/streams/producer.ts:28-44`), so the worker process can publish without new
plumbing. Public API: `createDurableStream`
(`packages/plugin-streams-core/src/application/create-durable-stream.ts:28-49` options, `:124-146`
`upsert`, `:148-170` `delete`, `:171-186` `flush/stop/close`, `:295-320` singleton-per-streamPath
with a fingerprint-mismatch throw). `upsert` returns `StreamWriteReceiptV1`
(`producer-contract-v1.ts:97-105`); bounded buffer 256 events / 1 MiB (`:47-55`).

**Environment precondition:** `getStreamsUrl()` requires `DURABLE_STREAMS_URL` or
`services__streams__http__0` (`packages/plugin-streams-core/src/application/stream-url-resolver.ts:154-190`);
missing → throw at `create-durable-stream.ts:262-272`. Whether `workers-combined` actually receives
that env is **unverified** — see below.

## Record shape and how `traceparent` is actually carried

`traceparent` is **not** on the stream record. It is a **header**, generated by the producer's own
`stream.publish` span: `create-durable-stream.ts:222-242` →
`packages/plugin-streams-core/src/telemetry/instrumentation.ts:159-177`
(`headers.traceparent = formatTraceparent(span.spanContext())`). `correlationId` defaults to the
entity key when no `StreamWriteContextV1` is passed (`create-durable-stream.ts:229-230`). The
envelope contract requires `operation`, `correlationId`, `traceparent`
(`packages/plugin-streams-core/src/domain/sse-contract-v1.ts:34-56`).

The `execution` entity schema **omits** `traceparent`/`tracestate`
(`packages/plugin-workers-core/src/streams/schema.ts`, `WorkerExecutionZodSchema`), and the mapper
drops them (`packages/plugin-workers-core/src/streams/producer.ts:88-106`).

**This matters more than it looks.** Because the header trace id comes from the publish span, the
join to `job.execute` is satisfied by *where the publish happens in the trace context*, not by
copying a field. That is what the E2E gate asserts.

## The gate that defines "done"

`packages/cli/e2e/src/application/gates/scaffold/consume-flow-b-stream.ts:52-107` reads the
`job.execute` correlation + trace id from the dashboard, then selects; offset/live-SSE loop at
`:203-230`. The selector `select-flow-b-stream-change.ts:68-115` matches on `value.correlationId`
else `headers.correlationId`, and `:122-153` (**TC-14**) requires the matched record's
`headers.traceparent` trace id to equal the `job.execute` trace id.

Consumer surface: `bindStreamEventSourceV1`, `createStreamSseReplayStateV1`,
`parseStreamSseEventV1` (`packages/plugin-streams-core/src/sse/mod.ts:30-34`); offsets are opaque
(`sse-contract-v1.ts:25,62-72`).

## Doctrine and dependency edges

- `plugins/workers/deno.json` **already declares** `@netscript/plugin-streams-core`, and the manifest
  declares `.withDependencies({ streams: streamsPlugin })` (`plugins/workers/src/public/mod.ts:61`).
  **A workers-side fix needs no new dependency edge.**
- Two undeclared-import findings, incidental to this issue but real:
  `packages/plugin-workers-core/deno.json` does not list `@netscript/plugin-streams-core` while
  `src/streams/producer.ts:1` and `src/streams/schema.ts:1-2` import it; same for
  `plugins/triggers/deno.json` vs `plugins/triggers/streams/{producer,factory,schema}.ts`. Both
  resolve through the workspace today. Whether `deno publish` rejects them is **unverified**.
- Plugins are Archetype 5 / thin; convention-bearing primitives belong in `-core`
  (`docs/architecture/doctrine/11-plugin-thinness-and-base-seams.md:16-36`).
- No `arch-debt.md` entry mentions #1398.

## Existing tests

`packages/plugin-workers-core/tests/streams/workers-streams_test.ts:9-104` covers the mapper and hook
as units against a mock producer, with **no traceparent assertion**. There is no test that would fail
if the hook were never installed on the background runtime — which is precisely why this shipped.

## The two decisions the plan must make (these are findings, not proposals)

1. **Volume and key collision.** Every mutation fires the hook (`execution-state.ts:288,307`), so
   installing it on the worker publishes roughly four records per execution
   (pending/queued/running/terminal) — each an `upsert` on the **same key**.
2. **Trace-context placement — the sharp edge.** TC-14 requires the matched record's publish span to
   be a child of `job.execute`. `complete()` (`job-dispatcher.ts:165`) **is** inside that active
   context, so its publish inherits the right trace id. But `create()` (`:74`) runs **before**
   `traceJobExecution` (`:91`), so a record published from it carries a **different** trace id. Since
   the selector matches on `correlationId` and both records share it, a naive "install the hook and
   publish everything" fix can produce a record set where the *first* match fails TC-14. Publishing
   more records is not automatically closer to passing.

`correlationId` reaches the consumer only because `toExecutionStreamEntity` sets `value.correlationId`;
`createStreamMutationHook` passes no `StreamWriteContextV1` (`producer.ts:112-118`).

## Unverified — do not treat as facts

- Whether `workers-combined` actually receives `services__streams__http__0` at runtime
  (`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts:180-220`
  was located but **not read**). If it does not, the fix is larger than a hook installation.
- Whether `plugins/workers/bin/{combined,worker,scheduler}.ts` exist as thin wrappers — only
  `bin/runtime.ts` was read.
- Whether `deno publish` fails on the undeclared `plugin-streams-core` imports above.
- The triggers-side execution publication (`plugins/triggers/streams/server.ts`) and whether its hook
  is installed.
- `packages/plugin-workers-core/src/domain/job-spec.ts:113-142` ("event published when a job
  execution completes") — not read.
- Workers SSE `subscribe.ts` (KV-watch, distinct from the durable stream) — not read.
- `validate-flow-b-traces.ts` contents — not read.
- Whether the streams schema carries an explicit version marker (bears on whether adding
  `traceparent` to the entity implies a version bump).

## Handoff — files to open in order

1. `plugins/workers/bin/runtime.ts:89-152` — the missing `setMutationHook` call site.
2. `plugins/workers/services/src/main.ts:65-75` — the correct wiring to mirror.
3. `plugins/workers/worker/job-dispatcher.ts:74-170` — identifiers and the `job.execute` context.
4. `packages/plugin-workers-core/src/streams/producer.ts:88-119` — mapper + hook.
5. `packages/plugin-workers-core/src/streams/schema.ts` — `WorkerExecutionZodSchema` field set.
6. `packages/plugin-streams-core/src/application/create-durable-stream.ts:124-146,222-242` — publish
   and header semantics.
7. `packages/cli/e2e/src/application/gates/scaffold/select-flow-b-stream-change.ts:122-153` — TC-14.
8. `packages/cli/e2e/suites/scaffold/capability-suites.ts:23-34` +
   `packages/cli/e2e/tests/presentation/suite-registry_test.ts:204-225` — the deferral to remove.
9. `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts:180-220`
   — confirm the streams env reaches `workers-combined` (**first unverified item**).
