# Caveats And Gaps

This file is input for a supervisor/maintainer strategy decision. It records real implementation caveats and gaps found during the read-only audit; it does not recommend changing code in this run.

## Real Caveats

### Triggers Webhooks Are Raw Hono, Not oRPC

Evidence:
- `plugins/triggers/services/src/router.ts:16` creates a `Hono` app.
- `plugins/triggers/services/src/router.ts:21` mounts `createWebhookRouter` under `/api/v1/webhooks`.
- `plugins/triggers/services/src/routers/webhooks.ts:13` and `:18` define raw `POST` routes.
- `plugins/triggers/services/src/routers/webhooks.ts:31` calls `ingress.accept` and returns an accepted JSON response.

User impact: This is not a bug. Third-party webhook senders post plain HTTP/JSON; no NetScript typed oRPC client participates in the ingress path.

Current docs: Accurate in `docs/site/tutorials/ingest-webhook.md:107`, `docs/site/tutorials/ingest-webhook.md:125`, and `docs/site/glossary.md:66`.

Gap-fill option: Keep as documented caveat. Effort: XS.

### Streams Topic Producer/Consumer Helpers Are Stubs

Evidence:
- `plugins/streams/src/public/stream-api.ts:24` defines `defineStreamProducer`.
- `plugins/streams/src/public/stream-api.ts:28` has an empty `publish` body.
- `plugins/streams/src/public/stream-api.ts:39` defines `defineStreamConsumer`.
- `plugins/streams/src/public/stream-api.ts:43` returns a no-op unsubscribe.

User impact: `@netscript/plugin-streams` topic authoring is real, but topic-centric pub/sub is not live. Users must not expect `producer.publish()` to emit or `consumer.subscribe()` to receive messages.

Current docs: Accurate in `docs/site/capabilities/streams.md:26`, `docs/site/capabilities/streams.md:29`, and `docs/site/glossary.md:62`.

Gap-fill option: Document as known limitation until topic helpers delegate to `@netscript/plugin-streams-core` durable producer/consumer. Effort to fix: M/L depending on consumer semantics.

### DurableStreamProducer Drops Writes After Connection Failure

Evidence:
- `packages/plugin-streams-core/src/application/create-durable-stream.ts:62` connects to the durable stream server.
- `packages/plugin-streams-core/src/application/create-durable-stream.ts:81` stores a connection error.
- `packages/plugin-streams-core/src/application/create-durable-stream.ts:87` warns that writes will be dropped until reconnect.
- `packages/plugin-streams-core/src/application/create-durable-stream.ts:118` skips appends when `#connectError` is set.
- `packages/plugin-streams-core/src/application/create-durable-stream.ts:222` makes `flush()` throw the connect error.

User impact: This is safer than silent success, but writes can be skipped after a failed connection. Docs should distinguish "core durable producer is real" from "connection failure is not retried in this producer".

Current docs: Streams docs emphasize topic API stubs and say core is the real path at `docs/site/capabilities/streams.md:33`; this specific drop-on-connect-failure behavior is not called out.

Gap-fill option: Add a known-limitations bullet to streams/reference docs. Effort: XS. Runtime fix with reconnect/backoff: M.

### Scaffolded Worker Job Tools Do Not Emit Spans

Evidence:
- `plugins/workers/jobs/job-tools.ts:41` progress only calls `ctx.reportProgress` if present.
- `plugins/workers/jobs/job-tools.ts:43` makes `trace.addEvent` a no-op.
- `plugins/workers/jobs/job-tools.ts:45` runs `withChildSpan` with a no-op span.
- Framework-level telemetry helpers are real: `packages/telemetry/src/core/span.ts:32` starts/ends spans; `packages/telemetry/src/instrumentation/worker.ts:202` wraps job execution.

User impact: A user copying scaffolded `createJobTools(ctx)` calls will not see job child spans or progress bars in Aspire. Service-level and framework instrumentation can still produce spans when wired.

Current docs: Accurate in `docs/site/capabilities/background-jobs.md:73`, `docs/site/capabilities/telemetry.md:103`, and `docs/site/explanation/observability.md:86`.

Gap-fill option: Keep warning. Add a short "framework helpers vs scaffold job tools" distinction in reference. Effort: S. Fix scaffold tools to call active span/report progress end-to-end: M.

### Task Executor Instrumentation Is Not Evidently OTel-Backed

Evidence:
- `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:31` accepts `instrumentations`.
- `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:100` applies them around status changes.
- `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:147` uses an in-memory `TaskExecutorSpan` with attributes/events arrays.

User impact: Polyglot task execution works, but task instrumentation hooks should not be described as exporting OpenTelemetry spans unless another integration wraps the collected span data. This audit did not find that bridge.

Current docs: No task-specific telemetry caveat found in audited pages.

Gap-fill option: Document as `UNVERIFIED`/known caveat in any new polyglot task docs. Effort: S. Runtime bridge to OTel: M.

### Trigger `defer` Actions Are Ignored By Runtime Dispatch

Evidence:
- `plugins/triggers/src/runtime/trigger-runtime-processor.ts:88` enters action dispatch.
- `plugins/triggers/src/runtime/trigger-runtime-processor.ts:94` returns immediately for `action.kind === 'defer'`.
- `plugins/triggers/src/runtime/trigger-runtime-processor.ts:98` only enqueue actions proceed to worker job dispatch.

User impact: A trigger action that intends deferred work will be accepted by the processor but not executed from this runtime path. This is a real behavior caveat.

Current docs: No audited docs page called this out.

Gap-fill option: Document as known limitation near trigger action types. Effort: XS. Implement deferred dispatch semantics: M.

### PostgreSQL Queue Provider Is Explicitly Not Implemented

Evidence:
- `packages/queue/factory/create-queue.ts:113` exposes `createQueue`.
- `packages/queue/factory/create-queue.ts:214` switches provider implementations.
- `packages/queue/factory/create-queue.ts:221` rejects `QueueProvider.Postgres`.
- `packages/queue/factory/create-queue.ts:225` says "PostgreSQL queue adapter not yet implemented".

User impact: Queue docs should not imply every provider enum is implemented. Deno KV, Redis, and RabbitMQ are the working paths from the factory; Postgres is a future adapter.

Current docs: Not in recon start set beyond the capability index entry at `docs/site/capabilities/index.md:27`.

Gap-fill option: Add provider support table to KV/queues/cron docs. Effort: S. Implement adapter: M/L.

### Possible Service RPC Path Drift

Evidence:
- `packages/service/src/presets/define-service.ts:18` comments that the oRPC endpoint is `/api/rpc/*`.
- `docs/site/tutorials/build-a-service.md:209` says typed oRPC surface is `/rpc`.

User impact: If the generated service actually serves `/api/rpc/*`, tutorial calls against `/rpc` will fail. This audit did not run a generated service to settle the runtime path.

Current docs: Potentially inaccurate.

Gap-fill option: Runtime-check with a scaffold service before editing docs. Effort: S.

## Gaps That Are Working Features

### Polyglot Tasks Need A First-Class IA Home

Evidence:
- Public builder: `packages/plugin-workers-core/src/public/root.ts:302` exports `defineTask`.
- Runtime types: `packages/plugin-workers-core/src/executor/executor-types.ts:2` supports `cmd`, `deno`, `dotnet`, `executable`, `powershell`, `python`, `shell`.
- Default adapters: `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:128`.
- Command builders: `packages/plugin-workers-core/src/executor/adapters/argv-builder.ts:7`, `:25`, `:40`, `:67`, `:87`, `:109`, `:117`.
- Worker integration: `plugins/workers/worker/job-execution.ts:117` and `plugins/workers/worker/queue-consumer.ts:49`.
- API: `packages/plugin-workers-core/src/contracts/v1/workers.contract-definition.ts:126`, `:140`, `:145`.

User impact: Users could run typed Deno jobs and polyglot tasks, but the docs currently lead them only to background jobs. That hides a substantial shipped capability.

Gap-fill option: New `capabilities/polyglot-tasks` page, cross-linked from background jobs, deploy, and workers reference. Effort: M.

### Fresh Meta-Framework Is Misclassified As Fresh UI

Evidence:
- Package exports: `packages/fresh/deno.json:5`.
- Route helpers: `packages/fresh/src/application/route/mod.ts:52`.
- Page builders: `packages/fresh/src/application/builders/mod.ts:26`.
- Form/query/defer/server/Vite/testing surfaces: `packages/fresh/src/application/form/mod.ts:32`, `packages/fresh/src/application/query/mod.ts:19`, `packages/fresh/src/application/defer/mod.ts:10`, `packages/fresh/src/runtime/server/mod.ts:11`, `packages/fresh/src/application/vite/vite.ts:191`, `packages/fresh/src/testing/mod.ts:93`.

User impact: Users will think NetScript has only a copied design system/dashboard, not a broader Fresh integration layer for routes, forms, defer, query hydration, streaming, app bootstrap, Vite, and testing.

Gap-fill option: Split IA into "Fresh framework" and "Fresh UI/design system"; keep Fresh UI as a child/sibling. Effort: M.

### Runtime Config Has Public/Operational Surface But Little User IA

Evidence:
- `packages/runtime-config/mod.ts:36` exports topics.
- `packages/runtime-config/mod.ts:37` exports loaders.
- `packages/runtime-config/mod.ts:45` exports watcher.
- `packages/runtime-config/mod.ts:50` exports summary diagnostics.
- CLI runtime overrides load additive tasks at `packages/cli/src/kernel/adapters/config/runtime-override.ts:78`.

User impact: Runtime override files are part of the deployed/operator model, especially for tasks, but users may not discover them.

Gap-fill option: Add runtime-config reference plus a short operations how-to. Effort: S/M.
