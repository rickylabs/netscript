---
layout: layouts/base.vto
title: '@netscript/telemetry'
---

# `@netscript/telemetry`

OpenTelemetry tracing primitives, context propagation, instrumentation registries, and NetScript
runtime adapters for jobs, queues, commands, RPC and SSE. Import the sub-path for the layer you
need; the root entrypoint holds only diagnostics and the instrumentation registry contract.

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/telemetry` | `./mod.ts` | [Diagnostics and the instrumentation registry contract](#root-entrypoint). |
| `@netscript/telemetry/config` | `./config.ts` | [Telemetry configuration and OTEL env resolution](#configuration-netscripttelemetryconfig). |
| `@netscript/telemetry/tracer` | `./tracer.ts` | [Tracer accessors and span helpers](#tracer-netscripttelemetrytracer). |
| `@netscript/telemetry/context` | `./context.ts` | [W3C trace-context propagation](#context-netscripttelemetrycontext). |
| `@netscript/telemetry/commands` | `./commands.ts` | [Privacy-first command adapter and native relationship wrappers](#command-telemetry). |
| `@netscript/telemetry/attributes` | `./attributes.ts` | [Semantic attribute and span-name constants](#attributes-netscripttelemetryattributes). |
| `@netscript/telemetry/instrumentation` | `./instrumentation.ts` | [Worker/queue/scheduler/SSE instrumentation](#instrumentation-netscripttelemetryinstrumentation). |
| `@netscript/telemetry/registry` | `./registry.ts` | [Instrumentation lifecycle registry](#registry-netscripttelemetryregistry). |
| `@netscript/telemetry/orpc` | `./orpc.ts` | [oRPC tracing and error-handling plugins](#orpc-netscripttelemetryorpc). |
| `@netscript/telemetry/hono` | `./hono.ts` | Hono request and response tracing middleware. |
| `@netscript/telemetry/ai` | `./ai.ts` | GenAI request, token, and chat-client metrics and tracing. |
| `@netscript/telemetry/otel` | `./src/adapters/otel/mod.ts` | OpenTelemetry Deno provider adapters. |
| `@netscript/telemetry/query` | `./query.ts` | Telemetry query capabilities and filters. |
| `@netscript/telemetry/testing` | `./src/testing/mod.ts` | In-memory span recorder for test verification. |

## Root entrypoint

Diagnostics, traced-job helpers, and the instrumentation registry contract.

### Functions

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `inspectTelemetry` | function | `function inspectTelemetry(target): InspectionReport` | Inspect a telemetry target and return a JSON-stable diagnostic report. |
| `initJobTracing` | function | `function initJobTracing(): Context \| null` | Initialize tracing in a job subprocess, continuing the trace from the worker. |
| `runTracedJob` | function | `async function runTracedJob<T>(jobId: string, fn): Promise<T>` | Wrap a job main function with context extraction and span creation. |

### Classes

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `InstrumentationRegistry` | class | `class InstrumentationRegistry` | Registry for telemetry instrumentation lifecycle hooks (`register`, `resolve`, `list`, `setupAll`, `teardownAll`). |
| `DuplicateInstrumentationError` | class | `class DuplicateInstrumentationError extends Error` | Error thrown when an instrumentation registration name is duplicated. |

### Types

| Symbol                        | Kind      | Description                                                                     |
| ----------------------------- | --------- | ------------------------------------------------------------------------------- |
| `InspectionReport`            | interface | JSON-stable diagnostic report returned by telemetry inspectors.                 |
| `InstrumentationContext`      | interface | Context supplied to instrumentation lifecycle hooks.                            |
| `InstrumentationEntry`        | interface | Diagnostic snapshot of a registry entry.                                        |
| `InstrumentationRegistration` | interface | Instrumentation lifecycle hooks accepted by `InstrumentationRegistry.register`. |

## Configuration (`@netscript/telemetry/config`)

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `getTelemetryConfig` | function | `function getTelemetryConfig(): TelemetryConfig` | Resolve the telemetry configuration from the environment. |
| `getConfig` | function | `function getConfig(): TelemetryConfig` | Get the cached singleton telemetry configuration. |
| `resetConfig` | function | `function resetConfig(): void` | Reset the cached singleton configuration. |
| `describeTelemetryConfig` | function | `function describeTelemetryConfig(): TelemetryConfigDescription` | Describe the effective configuration for diagnostics. |
| `isTelemetryEnabled` | function | `function isTelemetryEnabled(): boolean` | Whether telemetry is enabled in the current environment. |
| `getServiceName` | function | `function getServiceName(): string` | Resolve the configured OTEL service name. |
| `getOtlpEndpoint` | function | `function getOtlpEndpoint(): string \| undefined` | Resolve the OTLP exporter endpoint, if set. |
| `getOtelEnvVars` | function | `function getOtelEnvVars(): Record<string, string>` | Collect the resolved OTEL environment variables. |
| `OTEL_ENV_VARS` | const | `const OTEL_ENV_VARS` | Map of the supported OTEL environment variable names. |
| `TelemetryConfig` | interface | interface | Resolved telemetry configuration shape. |
| `TelemetryConfigDescription` | interface | interface | Human-readable configuration description. |

## Tracer (`@netscript/telemetry/tracer`)

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `getTracer` | function | `function getTracer(name: string, version: string): Tracer` | Get a named tracer at a version. |
| `getQueueTracer` | function | `function getQueueTracer(): Tracer` | Tracer for queue operations. |
| `getWorkerTracer` | function | `function getWorkerTracer(): Tracer` | Tracer for worker operations. |
| `getSchedulerTracer` | function | `function getSchedulerTracer(): Tracer` | Tracer for scheduler operations. |
| `getJobTracer` | function | `function getJobTracer(): Tracer` | Tracer for job operations. |
| `getSagaTracer` | function | `function getSagaTracer(): Tracer` | Tracer for saga operations. |
| `getSSETracer` | function | `function getSSETracer(): Tracer` | Tracer for SSE operations. |
| `getKVTracer` | function | `function getKVTracer(): Tracer` | Tracer for KV operations. |
| `createSpan` | function | `function createSpan(tracer, name, options): Span` | Create a span on the given tracer. |
| `withSpan` | function | `async function withSpan<T>(tracer, name, fn, options): Promise<T>` | Run an async function inside a span. |
| `withSpanSync` | function | `function withSpanSync<T>(tracer, name, fn, options): T` | Run a sync function inside a span. |
| `getActiveSpan` | function | `function getActiveSpan(): Span \| undefined` | Get the currently active span. |
| `getActiveContext` | function | `function getActiveContext(): Context` | Get the currently active context. |
| `addSpanEvent` | function | `function addSpanEvent(span, name, attributes?): void` | Add an event to a span. |
| `setSpanAttributes` | function | `function setSpanAttributes(span, attributes): void` | Set attributes on a span. |
| `setSpanError` | function | `function setSpanError(span, message, error?): void` | Mark a span as errored. |
| `setSpanOk` | function | `function setSpanOk(span): void` | Mark a span status as OK. |
| `isTracingEnabled` | function | `function isTracingEnabled(): boolean` | Whether tracing is currently enabled. |
| `TracerNames` | const | `const TracerNames` | Canonical tracer names: QUEUE, WORKER, SCHEDULER, JOB, SAGA, SSE, KV, DEFAULT. |
| `SpanKind` | const / type alias | `const SpanKind` / `type SpanKind` | Span kind enum: INTERNAL, SERVER, CLIENT, PRODUCER, CONSUMER. |
| `SpanStatusCode` | const / type alias | `const SpanStatusCode` / `type SpanStatusCode` | Span status code enum: UNSET, OK, ERROR. |
| `Context`, `Span`, `Tracer`, `CreateSpanOptions`, `Link`, `Attributes` | interface / type alias | type aliases / interfaces | Core OpenTelemetry-compatible span and context types. |

## Context (`@netscript/telemetry/context`)

W3C trace-context propagation across job subprocesses and message headers.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `withContext` | function | `function withContext<T>(ctx, fn): T` | Run a sync function with the given context active. |
| `withContextAsync` | function | `async function withContextAsync<T>(ctx, fn): Promise<T>` | Run an async function with the given context active. |
| `contextWithSpan` | function | `function contextWithSpan(span, parentContext?): Context` | Build a context carrying the given span. |
| `getSpanFromContext` | function | `function getSpanFromContext(ctx): Span \| undefined` | Extract the span from a context. |
| `getTraceId` | function | `function getTraceId(ctx?): string \| undefined` | Get the trace id from a context. |
| `getSpanId` | function | `function getSpanId(ctx?): string \| undefined` | Get the span id from a context. |
| `hasActiveSpan` | function | `function hasActiveSpan(ctx?): boolean` | Whether a context carries an active span. |
| `injectContext` | function | `function injectContext(headers, ctx?): PropagationHeaders` | Inject context into propagation headers. |
| `extractContext` | function | `function extractContext(headers): Context` | Extract a context from propagation headers. |
| `createMessageHeaders` | function | `function createMessageHeaders(additionalHeaders): PropagationHeaders` | Build message headers with trace context. |
| `formatTraceparent` | function | `function formatTraceparent(spanContext): string` | Format a `traceparent` header value. |
| `parseTraceparent` | function | `function parseTraceparent(traceparent): ParsedTraceparent \| null` | Parse a `traceparent` header value. |
| `resolveParentContextFromHeaders` | function | `function resolveParentContextFromHeaders(headers?): Context` | Resolve a parent context from headers. |
| `resolveTraceContext` | function | `function resolveTraceContext(ctx?): SerializedTraceContext \| null` | Serialize the active trace context. |
| `resolveTraceContextFromSpan` | function | `function resolveTraceContextFromSpan(span): SerializedTraceContext` | Serialize trace context from a span. |
| `extractFromTraceContext` | function | `function extractFromTraceContext(traceContext): Context` | Rehydrate a context from a serialized payload. |
| `createJobTraceEnv` | function | `function createJobTraceEnv(ctx?): JobTraceEnv` | Build job subprocess env carrying trace context. |
| `extractJobTraceContext` | function | `function extractJobTraceContext(): Context \| null` | Extract trace context from the job subprocess env. |
| `JobTraceEnv`, `ParsedTraceparent`, `SerializedTraceContext` | interface | interfaces | Context-propagation payload shapes. |

## Attributes (`@netscript/telemetry/attributes`)

Semantic attribute keys, span-name constants, and attribute builders. The TC-1..TC-14 checklist is
in the [telemetry convention](./convention/).

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `spanName` | function | `function spanName(base: string, suffix?: string): string` | Compose a namespaced span name. |
| `createJobAttributes` | function | `function createJobAttributes(job): Record<string, AttributeValue>` | Build job span attributes with beta.5 deprecated aliases. |
| `createMessagingAttributes` | function | `function createMessagingAttributes(options): Record<string, AttributeValue>` | Build messaging span attributes. |
| `createSagaAttributes` | function | `function createSagaAttributes(saga): Record<string, AttributeValue>` | Build saga span attributes with beta.5 deprecated aliases. |
| `createExecutionAttributes` | function | `function createExecutionAttributes(execution): Record<string, AttributeValue>` | Build execution lifecycle span attributes. |
| `createGenAiAttributes` | function | `function createGenAiAttributes(genai): Record<string, AttributeValue>` | Build GenAI semantic-convention attributes. |
| `createTriggerAttributes` | function | `function createTriggerAttributes(trigger): Record<string, string>` | Build trigger span attributes. |
| `createTriggerFileAttributes` | function | `function createTriggerFileAttributes(payload): Record<string, string \| number>` | Build file-trigger span attributes. |
| `CacheAttributes` | const | `const CacheAttributes` | Cache-topology attribute-name constants for the published `netscript.cache.*` compatibility surface; the operation key is the shared `netscript.operation`. |
| `CacheOperations` | const | `const CacheOperations` | Logical span-name verbs: `cache.read`, `cache.write`, and `cache.invalidate`; promotion is a `cache.promote` event, not a fourth operation verb. |
| `CacheOperation` | type alias | `type CacheOperation` | Union of the logical cache-operation verbs in `CacheOperations`. |
| `CacheTiers` | const | `const CacheTiers` | Runtime-validated cache tiers: `l1`, `l2`, and `durable`. |
| `CacheTier` | type alias | `type CacheTier = 'l1' \| 'l2' \| 'durable'` | Bounded cache-tier identifier accepted by cache-topology attributes. |
| `CacheOutcomes` | const | `const CacheOutcomes` | Bounded results: `hit`, `miss`, `stale`, and `error`. An unknowable successful provider chain sets `topology_complete=false` and omits `outcome`; `error` is emitted only when the operation throws. |
| `CacheOutcome` | type alias | `type CacheOutcome = 'hit' \| 'miss' \| 'stale' \| 'error'` | Union of the bounded lookup and mutation outcomes in `CacheOutcomes`. |
| `CacheAttributeOptions` | type alias | `type CacheAttributeOptions` | Bounded operation, provider, namespace, tier, outcome, timing, loader, and topology facts accepted by the cache attribute builder; it has no cache-key field. |
| `createCacheAttributes` | function | `function createCacheAttributes(options: CacheAttributeOptions): TelemetryAttributeBuilderMap` | Build bounded cache-topology attributes. The API accepts no cache key, making raw-key leakage structurally impossible. |
| `TelemetryConventionChecklist` | const | `const TelemetryConventionChecklist` | TC-1..TC-14 conformance checklist. |
| `SpanNames` | const | `const SpanNames` | Canonical span-name constants for scheduler, queue, worker, job, saga, execution, RPC, GenAI, SSE, KV, and trigger spans. |
| `NetScriptAttributeDomains` | const | `const NetScriptAttributeDomains` | Single-root `netscript.*` proprietary attribute domains. |
| `NetScriptCorrelationAttributes` | const | `const NetScriptCorrelationAttributes` | Shared `netscript.correlation.id` attribute floor. |
| `ExecutionAttributes` / `NetScriptExecutionAttributes` | const | `const` | Deprecated execution aliases and canonical execution lifecycle attribute keys. |
| `JobAttributes` / `NetScriptJobAttributes` / `JobStatuses` / `JobTriggers` | const | const | Deprecated job aliases, canonical job keys, and enumerated status/trigger values. |
| `WorkerAttributes` | const | `const WorkerAttributes` | Worker attribute keys. |
| `SchedulerAttributes` | const | `const SchedulerAttributes` | Scheduler attribute keys. |
| `MessagingAttributes` / `MessagingOperations` / `MessagingSystems` | const | const | Messaging attribute keys and enumerated operations/systems. |
| `SagaAttributes` | const | `const SagaAttributes` | Saga attribute keys. |
| `GenAiAttributes` | const | `const GenAiAttributes` | GenAI semantic-convention attribute keys. |
| `KVAttributes` / `KVOperations` | const | const | KV attribute keys and operation values. |
| `SSEAttributes` | const | `const SSEAttributes` | SSE attribute keys. |
| `TriggerAttributes` | const | `const TriggerAttributes` | Trigger attribute keys. |

## Instrumentation (`@netscript/telemetry/instrumentation`)

Span builders and recorders for workers, queues, schedulers, SSE, and job dispatch.

`TracedQueue.listen` delivers a `TracedQueueMessageContext`, which extends `TracedMessageContext`
with a required consumer `span`. Call `ctx.span.setAttribute('job.id', message.jobId)` inside the
callback to annotate that active span. Plain `MessageQueue` handlers stay compatible, and the shared
`TracedMessageContext` keeps its optional span for other consumers.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `startWorkerSpan` | function | `function startWorkerSpan(config): Span` | Start a worker span. |
| `createWorkerStopSpan` | function | `function createWorkerStopSpan(workerId, activeJobs): Span` | Span for worker shutdown. |
| `recordWorkerMetrics` | function | `function recordWorkerMetrics(span, metrics): void` | Record worker metrics on a span. |
| `traceJobExecution` | function | `async function traceJobExecution<T>(options, fn): Promise<T>` | Trace a job execution. |
| `createJobSpawnSpan` | function | `function createJobSpawnSpan(job, executionId): Span` | Span for spawning a job subprocess. |
| `createJobSubprocessEnv` | function | `function createJobSubprocessEnv(additionalEnv): Record<string, string>` | Build the traced subprocess env. |
| `getJobTraceContext` | function | `function getJobTraceContext(): SerializedTraceContext \| null` | Read serialized trace context in a job. |
| `initJobTracing` | function | `function initJobTracing(): Context \| null` | Initialize tracing in a job subprocess. |
| `runTracedJob` | function | `async function runTracedJob<T>(jobId, fn): Promise<T>` | Wrap a job main with tracing. |
| `addJobStepEvent` | function | `function addJobStepEvent(stepName, attributes?): void` | Add a step event to the active job span. |
| `recordJobProgress` | function | `function recordJobProgress(current, total, unit): void` | Record job progress on the active span. |
| `startJobDispatchSpan` | function | `function startJobDispatchSpan(context, options)` | Start a job-dispatch span and propagation headers. |
| `traceJobDispatch` | function | `async function traceJobDispatch(context, fn, options): Promise<void>` | Trace a job dispatch. |
| `isTracedQueue` | function | `function isTracedQueue<T>(queue): queue is TracedQueue<T>` | Type guard for a traced queue. |
| `TracedQueueMessageContext` | interface | interface | Consumer context with a guaranteed span, delivered by TracedQueue.listen. |
| `startSchedulerTickSpan` | function | `function startSchedulerTickSpan(context): Span` | Span for a scheduler tick. |
| `createSchedulerStartSpan`, `createSchedulerStopSpan` | function | functions returning `Span` | Spans for scheduler start/stop. |
| `createScheduleJobSpan`, `createUnscheduleJobSpan` | function | functions returning `Span` | Root spans for scheduling/unscheduling a job. |
| `recordCronJobRun`, `recordSchedulerReload` | function | functions returning `void` | Record scheduler run/reload outcomes. |

## Registry (`@netscript/telemetry/registry`)

Instrumentation lifecycle registry, also re-exported from the root entrypoint.

| Symbol                          | Kind      | Description                                   |
| ------------------------------- | --------- | --------------------------------------------- |
| `InstrumentationRegistry`       | class     | Registry for instrumentation lifecycle hooks. |
| `DuplicateInstrumentationError` | class     | Duplicate registration name error.            |
| `InstrumentationContext`        | interface | Lifecycle hook context.                       |
| `InstrumentationEntry`          | interface | Diagnostic registry snapshot.                 |
| `InstrumentationRegistration`   | interface | Registered lifecycle hooks.                   |

## oRPC (`@netscript/telemetry/orpc`)

Tracing and error-handling plugins for the NetScript oRPC handler.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createTracingPlugin` | function | `function createTracingPlugin(options?): TracingPlugin` | Create the oRPC tracing plugin. |
| `TracingPlugin` | class | `class TracingPlugin` | oRPC tracing plugin. |
| `createErrorHandlingPlugin` | function | `function createErrorHandlingPlugin(options?): ErrorHandlingPlugin` | Create the oRPC error-handling plugin. |
| `ErrorHandlingPlugin` | class | `class ErrorHandlingPlugin` | oRPC error-handling plugin. |
| `createTraceContext` | function | `function createTraceContext(): TraceContext` | Create a handler-scoped trace context. |
| `addEvent` | function | `function addEvent(name, attributes?): void` | Add an event to the active handler span. |
| `setAttributes` | function | `function setAttributes(attributes): void` | Set attributes on the active handler span. |
| `getTraceId`, `getSpanId` | function | functions returning `string \| undefined` | Read the active handler trace/span id. |
| `TraceContext` | interface | interface | Handler-scoped trace context contract. |
| `TracingPluginOptions`, `ErrorHandlingPluginOptions` | interface | interfaces | Plugin options. |
| `ErrorContext`, `ErrorLogger` | interface | interfaces | Error plugin payload and logger contracts. |

## Command telemetry

`@netscript/telemetry/commands` exports `createOtelCommandTelemetryPort({ definitions, tracer? })`,
a privacy-first adapter structurally compatible with `CommandTelemetryPort`. Register static
name/version metadata (1–1024 unique pairs, names at most 120 characters) and pass it to the command
executor. The attribute builders and closed vocabularies live in `@netscript/telemetry/attributes`.

| Span | Kind |
| --- | --- |
| `command.execute` | INTERNAL |
| `command.outbox.relay` | INTERNAL |
| `command.outbox.publish` | PRODUCER |

- Publication makes native context active, so W3C injection can parent the consumer or create a
  deferred link.
- No queue implementation or metric instrument is created.
- Counts are bounded to 0–64 and appear only on applied/replayed outcomes.
- Only stable command failure kinds enter `error.type`. Payloads, raw identities, hashes,
  correlation IDs, topics/destinations and exception text never enter command spans.
- Messaging and saga identifier conventions keep their separate ownership; the command privacy
  policy supersedes their general correlation/exception floor.

| Symbol | Kind | Description |
| --- | --- | --- |
| `CommandSpanNames` | const | Fixed execute, relay lifecycle and publication names. |
| `CommandAttributes` | const | The eight identifier-free RFC command attribute keys. |
| `CommandOutcomes` | const | Closed applied/replayed/conflict/rejected/failed/cancelled values. |
| `CommandIdempotencyStates` | const | Closed claimed/replayed/not_requested/missing/mismatch/busy values. |
| `CommandIsolationLevels` | const | Store isolation enums plus default. |
| `CommandStoreProviders` | const | Bounded postgres/mssql/mysql/sqlite values. |
| `CommandErrorTypes` | const | Nine stable command failure kinds, excluding exception text. |
| `CommandTelemetryDefinition` | type alias | Static registered name/version pair. |
| `OtelCommandTelemetryStart` | type alias | Finite definition/provider/isolation/idempotency observation. |
| `OtelCommandTelemetryResult` | type alias | Finite outcome, counts and optional stable failure kind. |
| `commandStartAttributes` | function | Validate configured definition membership and select initial attributes. |
| `commandResultAttributes` | function | Validate completion and emit counts only for successful outcomes. |
| `createOtelCommandTelemetryPort` | function | Copy registrations and compose the structural executor adapter. |
| `CreateOtelCommandTelemetryPortOptions` | type alias | Construction-time registrations and optional native tracer. |
| `OtelCommandTelemetryPort` | interface | Execute, relay and publication wrappers invoking operations once. |
| `OtelCommandTelemetrySpan` | interface | Once-only finite completion observer. |
