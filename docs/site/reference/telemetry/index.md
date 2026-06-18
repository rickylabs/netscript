---
layout: layouts/base.vto
title: "@netscript/telemetry"
---

# `@netscript/telemetry`

OpenTelemetry tracing primitives, context propagation, instrumentation registries, and
NetScript runtime adapters for jobs, queues, RPC, and SSE. This page is generated from the
package's public surface with `deno doc` (US-2). For the full index of packages and plugins
return to the [reference overview](/reference/).

The root entrypoint (`@netscript/telemetry`) exposes the stable package diagnostic and
instrumentation registry contract only. Runtime helpers live on typed sub-path exports so
callers import just the layer they need:

- [`@netscript/telemetry/config`](#sub-path-exports) — telemetry configuration and OTEL env resolution.
- [`@netscript/telemetry/tracer`](#sub-path-exports) — tracer accessors and span helpers.
- [`@netscript/telemetry/context`](#sub-path-exports) — W3C trace context propagation.
- [`@netscript/telemetry/attributes`](#sub-path-exports) — semantic attribute and span-name constants.
- [`@netscript/telemetry/instrumentation`](#sub-path-exports) — worker/queue/scheduler/SSE instrumentation.
- [`@netscript/telemetry/registry`](#sub-path-exports) — instrumentation lifecycle registry.
- [`@netscript/telemetry/orpc`](#sub-path-exports) — oRPC tracing and error-handling plugins.

## Root entrypoint

Diagnostics, traced-job helpers, and the instrumentation registry contract.

### Functions

| Symbol | Signature | Description |
| --- | --- | --- |
| `inspectTelemetry` | `function inspectTelemetry(target): InspectionReport` | Inspect a telemetry target and return a JSON-stable diagnostic report. |
| `initJobTracing` | `function initJobTracing(): Context \| null` | Initialize tracing in a job subprocess, continuing the trace from the worker. |
| `runTracedJob` | `async function runTracedJob<T>(jobId: string, fn): Promise<T>` | Wrap a job main function with context extraction and span creation. |

### Classes

| Symbol | Signature | Description |
| --- | --- | --- |
| `InstrumentationRegistry` | `class InstrumentationRegistry` | Registry for telemetry instrumentation lifecycle hooks (`register`, `resolve`, `list`, `setupAll`, `teardownAll`). |
| `DuplicateInstrumentationError` | `class DuplicateInstrumentationError extends Error` | Error thrown when an instrumentation registration name is duplicated. |

### Types

| Symbol | Kind | Description |
| --- | --- | --- |
| `InspectionReport` | interface | JSON-stable diagnostic report returned by telemetry inspectors. |
| `InstrumentationContext` | interface | Context supplied to instrumentation lifecycle hooks. |
| `InstrumentationEntry` | interface | Diagnostic snapshot of a registry entry. |
| `InstrumentationRegistration` | interface | Instrumentation lifecycle hooks accepted by `InstrumentationRegistry.register`. |

## Configuration (`@netscript/telemetry/config`)

| Symbol | Signature | Description |
| --- | --- | --- |
| `getTelemetryConfig` | `function getTelemetryConfig(): TelemetryConfig` | Resolve the telemetry configuration from the environment. |
| `getConfig` | `function getConfig(): TelemetryConfig` | Get the cached singleton telemetry configuration. |
| `resetConfig` | `function resetConfig(): void` | Reset the cached singleton configuration. |
| `describeTelemetryConfig` | `function describeTelemetryConfig(): TelemetryConfigDescription` | Describe the effective configuration for diagnostics. |
| `isTelemetryEnabled` | `function isTelemetryEnabled(): boolean` | Whether telemetry is enabled in the current environment. |
| `getServiceName` | `function getServiceName(): string` | Resolve the configured OTEL service name. |
| `getOtlpEndpoint` | `function getOtlpEndpoint(): string \| undefined` | Resolve the OTLP exporter endpoint, if set. |
| `getOtelEnvVars` | `function getOtelEnvVars(): Record<string, string>` | Collect the resolved OTEL environment variables. |
| `OTEL_ENV_VARS` | `const OTEL_ENV_VARS` | Map of the supported OTEL environment variable names. |
| `TelemetryConfig` | interface | Resolved telemetry configuration shape. |
| `TelemetryConfigDescription` | interface | Human-readable configuration description. |

## Tracer (`@netscript/telemetry/tracer`)

| Symbol | Signature | Description |
| --- | --- | --- |
| `getTracer` | `function getTracer(name: string, version: string): Tracer` | Get a named tracer at a version. |
| `getQueueTracer` | `function getQueueTracer(): Tracer` | Tracer for queue operations. |
| `getWorkerTracer` | `function getWorkerTracer(): Tracer` | Tracer for worker operations. |
| `getSchedulerTracer` | `function getSchedulerTracer(): Tracer` | Tracer for scheduler operations. |
| `getJobTracer` | `function getJobTracer(): Tracer` | Tracer for job operations. |
| `getSagaTracer` | `function getSagaTracer(): Tracer` | Tracer for saga operations. |
| `getSSETracer` | `function getSSETracer(): Tracer` | Tracer for SSE operations. |
| `getKVTracer` | `function getKVTracer(): Tracer` | Tracer for KV operations. |
| `createSpan` | `function createSpan(tracer, name, options): Span` | Create a span on the given tracer. |
| `withSpan` | `async function withSpan<T>(tracer, name, fn, options): Promise<T>` | Run an async function inside a span. |
| `withSpanSync` | `function withSpanSync<T>(tracer, name, fn, options): T` | Run a sync function inside a span. |
| `getActiveSpan` | `function getActiveSpan(): Span \| undefined` | Get the currently active span. |
| `getActiveContext` | `function getActiveContext(): Context` | Get the currently active context. |
| `addSpanEvent` | `function addSpanEvent(span, name, attributes?): void` | Add an event to a span. |
| `setSpanAttributes` | `function setSpanAttributes(span, attributes): void` | Set attributes on a span. |
| `setSpanError` | `function setSpanError(span, message, error?): void` | Mark a span as errored. |
| `setSpanOk` | `function setSpanOk(span): void` | Mark a span status as OK. |
| `isTracingEnabled` | `function isTracingEnabled(): boolean` | Whether tracing is currently enabled. |
| `TracerNames` | `const TracerNames` | Canonical tracer names: QUEUE, WORKER, SCHEDULER, JOB, SAGA, SSE, KV, DEFAULT. |
| `SpanKind` | `const SpanKind` / `type SpanKind` | Span kind enum: INTERNAL, SERVER, CLIENT, PRODUCER, CONSUMER. |
| `SpanStatusCode` | `const SpanStatusCode` / `type SpanStatusCode` | Span status code enum: UNSET, OK, ERROR. |
| `Context`, `Span`, `Tracer`, `CreateSpanOptions`, `Link`, `Attributes` | type aliases / interfaces | Core OpenTelemetry-compatible span and context types. |

## Context (`@netscript/telemetry/context`)

W3C trace-context propagation across job subprocesses and message headers.

| Symbol | Signature | Description |
| --- | --- | --- |
| `withContext` | `function withContext<T>(ctx, fn): T` | Run a sync function with the given context active. |
| `withContextAsync` | `async function withContextAsync<T>(ctx, fn): Promise<T>` | Run an async function with the given context active. |
| `contextWithSpan` | `function contextWithSpan(span, parentContext?): Context` | Build a context carrying the given span. |
| `getSpanFromContext` | `function getSpanFromContext(ctx): Span \| undefined` | Extract the span from a context. |
| `getTraceId` | `function getTraceId(ctx?): string \| undefined` | Get the trace id from a context. |
| `getSpanId` | `function getSpanId(ctx?): string \| undefined` | Get the span id from a context. |
| `hasActiveSpan` | `function hasActiveSpan(ctx?): boolean` | Whether a context carries an active span. |
| `injectContext` | `function injectContext(headers, ctx?): PropagationHeaders` | Inject context into propagation headers. |
| `extractContext` | `function extractContext(headers): Context` | Extract a context from propagation headers. |
| `createMessageHeaders` | `function createMessageHeaders(additionalHeaders): PropagationHeaders` | Build message headers with trace context. |
| `formatTraceparent` | `function formatTraceparent(spanContext): string` | Format a `traceparent` header value. |
| `parseTraceparent` | `function parseTraceparent(traceparent): ParsedTraceparent \| null` | Parse a `traceparent` header value. |
| `resolveParentContextFromHeaders` | `function resolveParentContextFromHeaders(headers?): Context` | Resolve a parent context from headers. |
| `resolveTraceContext` | `function resolveTraceContext(ctx?): SerializedTraceContext \| null` | Serialize the active trace context. |
| `resolveTraceContextFromSpan` | `function resolveTraceContextFromSpan(span): SerializedTraceContext` | Serialize trace context from a span. |
| `extractFromTraceContext` | `function extractFromTraceContext(traceContext): Context` | Rehydrate a context from a serialized payload. |
| `createJobTraceEnv` | `function createJobTraceEnv(ctx?): JobTraceEnv` | Build job subprocess env carrying trace context. |
| `extractJobTraceContext` | `function extractJobTraceContext(): Context \| null` | Extract trace context from the job subprocess env. |
| `JobTraceEnv`, `ParsedTraceparent`, `SerializedTraceContext` | interfaces | Context-propagation payload shapes. |

## Attributes (`@netscript/telemetry/attributes`)

Semantic attribute keys, span-name constants, and attribute builders.

| Symbol | Signature | Description |
| --- | --- | --- |
| `spanName` | `function spanName(base: string, suffix?: string): string` | Compose a namespaced span name. |
| `createJobAttributes` | `function createJobAttributes(job): Record<string, string \| number>` | Build job span attributes. |
| `createMessagingAttributes` | `function createMessagingAttributes(options): Record<string, string \| number>` | Build messaging span attributes. |
| `createTriggerAttributes` | `function createTriggerAttributes(trigger): Record<string, string>` | Build trigger span attributes. |
| `createTriggerFileAttributes` | `function createTriggerFileAttributes(payload): Record<string, string \| number>` | Build file-trigger span attributes. |
| `SpanNames` | `const SpanNames` | Canonical span-name constants for scheduler, queue, worker, job, SSE, KV, and trigger spans. |
| `ExecutionAttributes` | `const ExecutionAttributes` | Execution lifecycle attribute keys. |
| `JobAttributes` / `JobStatuses` / `JobTriggers` | const | Job attribute keys and enumerated status/trigger values. |
| `WorkerAttributes` | `const WorkerAttributes` | Worker attribute keys. |
| `SchedulerAttributes` | `const SchedulerAttributes` | Scheduler attribute keys. |
| `MessagingAttributes` / `MessagingOperations` / `MessagingSystems` | const | Messaging attribute keys and enumerated operations/systems. |
| `KVAttributes` / `KVOperations` | const | KV attribute keys and operation values. |
| `SSEAttributes` | `const SSEAttributes` | SSE attribute keys. |
| `TriggerAttributes` | `const TriggerAttributes` | Trigger attribute keys. |

## Instrumentation (`@netscript/telemetry/instrumentation`)

Span builders and recorders for workers, queues, schedulers, SSE, and job dispatch.

| Symbol | Signature | Description |
| --- | --- | --- |
| `startWorkerSpan` | `function startWorkerSpan(config): Span` | Start a worker span. |
| `createWorkerStopSpan` | `function createWorkerStopSpan(workerId, activeJobs): Span` | Span for worker shutdown. |
| `recordWorkerMetrics` | `function recordWorkerMetrics(span, metrics): void` | Record worker metrics on a span. |
| `traceJobExecution` | `async function traceJobExecution<T>(options, fn): Promise<T>` | Trace a job execution. |
| `createJobSpawnSpan` | `function createJobSpawnSpan(job, executionId): Span` | Span for spawning a job subprocess. |
| `createJobSubprocessEnv` | `function createJobSubprocessEnv(additionalEnv): Record<string, string>` | Build the traced subprocess env. |
| `getJobTraceContext` | `function getJobTraceContext(): SerializedTraceContext \| null` | Read serialized trace context in a job. |
| `initJobTracing` | `function initJobTracing(): Context \| null` | Initialize tracing in a job subprocess. |
| `runTracedJob` | `async function runTracedJob<T>(jobId, fn): Promise<T>` | Wrap a job main with tracing. |
| `addJobStepEvent` | `function addJobStepEvent(stepName, attributes?): void` | Add a step event to the active job span. |
| `recordJobProgress` | `function recordJobProgress(current, total, unit): void` | Record job progress on the active span. |
| `createJobLinkAttributes` | `function createJobLinkAttributes(traceContext): Attributes` | Build span-link attributes for a job. |
| `startJobDispatchSpan` | `function startJobDispatchSpan(context, options)` | Start a job-dispatch span and propagation headers. |
| `traceJobDispatch` | `async function traceJobDispatch(context, fn, options): Promise<void>` | Trace a job dispatch. |
| `isTracedQueue` | `function isTracedQueue<T>(queue): queue is TracedQueue<T>` | Type guard for a traced queue. |
| `startSchedulerTickSpan` | `function startSchedulerTickSpan(context): Span` | Span for a scheduler tick. |
| `createSchedulerStartSpan`, `createSchedulerStopSpan` | functions returning `Span` | Spans for scheduler start/stop. |
| `createScheduleJobSpan`, `createUnscheduleJobSpan` | functions returning `Span` | Root spans for scheduling/unscheduling a job. |
| `recordCronJobRun`, `recordSchedulerReload` | functions returning `void` | Record scheduler run/reload outcomes. |
| `startSSEConnection` | `function startSSEConnection(context, options): TracedSSEConnection` | Start a traced SSE connection. |
| `createSSEEventSpan`, `createSSESubscribeSpan` | functions returning `Span` | Spans for SSE events and subscribe. |
| `generateSSEClientId` | `function generateSSEClientId(): string` | Generate an SSE client id. |
| `recordSSEMetrics` | `function recordSSEMetrics(metrics): void` | Record SSE metrics. |
| `extractTraceContextFromRecord` | `function extractTraceContextFromRecord(record): SerializedTraceContext \| null` | Extract trace context from a queue record. |

## Registry (`@netscript/telemetry/registry`)

Instrumentation lifecycle registry (also re-exported from the root entrypoint).

| Symbol | Kind | Description |
| --- | --- | --- |
| `InstrumentationRegistry` | class | Registry for instrumentation lifecycle hooks. |
| `DuplicateInstrumentationError` | class | Duplicate registration name error. |
| `InstrumentationContext` | interface | Lifecycle hook context. |
| `InstrumentationEntry` | interface | Diagnostic registry snapshot. |
| `InstrumentationRegistration` | interface | Registered lifecycle hooks. |

## oRPC (`@netscript/telemetry/orpc`)

Tracing and error-handling plugins for the NetScript oRPC handler.

| Symbol | Signature | Description |
| --- | --- | --- |
| `createTracingPlugin` | `function createTracingPlugin(options?): TracingPlugin` | Create the oRPC tracing plugin. |
| `TracingPlugin` | `class TracingPlugin` | oRPC tracing plugin. |
| `createErrorHandlingPlugin` | `function createErrorHandlingPlugin(options?): ErrorHandlingPlugin` | Create the oRPC error-handling plugin. |
| `ErrorHandlingPlugin` | `class ErrorHandlingPlugin` | oRPC error-handling plugin. |
| `createTraceContext` | `function createTraceContext(): TraceContext` | Create a handler-scoped trace context. |
| `addEvent` | `function addEvent(name, attributes?): void` | Add an event to the active handler span. |
| `setAttributes` | `function setAttributes(attributes): void` | Set attributes on the active handler span. |
| `getTraceId`, `getSpanId` | functions returning `string \| undefined` | Read the active handler trace/span id. |
| `TraceContext` | interface | Handler-scoped trace context contract. |
| `TracingPluginOptions`, `ErrorHandlingPluginOptions` | interfaces | Plugin options. |
| `ErrorContext`, `ErrorLogger` | interfaces | Error plugin payload and logger contracts. |

## Sub-path exports

The following entrypoints are published alongside the root export. Each is generated from its
own `deno doc` surface.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/telemetry` | `./mod.ts` | Diagnostics + instrumentation registry contract (documented above). |
| `@netscript/telemetry/config` | `./config.ts` | Telemetry configuration and OTEL env resolution. |
| `@netscript/telemetry/tracer` | `./tracer.ts` | Tracer accessors and span helpers. |
| `@netscript/telemetry/context` | `./context.ts` | W3C trace-context propagation. |
| `@netscript/telemetry/attributes` | `./attributes.ts` | Semantic attribute and span-name constants. |
| `@netscript/telemetry/instrumentation` | `./instrumentation.ts` | Worker/queue/scheduler/SSE instrumentation. |
| `@netscript/telemetry/registry` | `./src/runtime/mod.ts` | Instrumentation lifecycle registry. |
| `@netscript/telemetry/orpc` | `./orpc.ts` | oRPC tracing and error-handling plugins. |

---

Back to the [reference overview](/reference/).
