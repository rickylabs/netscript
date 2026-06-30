---
layout: layouts/base.vto
title: "@netscript/plugin-triggers"
---

# `@netscript/plugin-triggers`

NetScript plugin for trigger ingress, scheduling, file watching, and the trigger runtime APIs.
This page is generated from the package's public surface with `deno doc` (US-2). For the full
index of packages and plugins return to the [reference overview](/reference/).

The plugin's root entrypoint (`@netscript/plugin-triggers`) exposes the public **plugin manifest**
surface — the manifest value and its metadata constants. Shared manifest inspection is provided by
`inspectPlugin` from `@netscript/plugin`. The handler-first authoring DSL (`defineWebhook`,
`defineScheduledTrigger`, `defineFileWatch`, `enqueueJob`) and the runtime ports live in the sibling
core package and are documented in [Internals](#internals) below.

Additional integration entrypoints are published as [sub-path exports](#sub-path-exports):
`./public`, `./plugin`, `./runtime`, `./scaffolding`, `./aspire`, `./cli`, `./services`,
`./streams`, and `./streams/server`. Their reference detail is generated from their own
`deno doc` surface.

## Plugin manifest

| Symbol | Signature | Description |
| --- | --- | --- |
| `triggersPlugin` | `const triggersPlugin: PluginManifest` | Plugin manifest for NetScript triggers. |

## Manifest constants

| Symbol | Signature | Description |
| --- | --- | --- |
| `TRIGGERS_PLUGIN_ID` | `const TRIGGERS_PLUGIN_ID = "triggers"` | Stable plugin identifier for NetScript triggers. |
| `TRIGGERS_PLUGIN_VERSION` | `const TRIGGERS_PLUGIN_VERSION = "0.1.0"` | Initial plugin package version. |
| `TRIGGERS_API_SERVICE_NAME` | `const TRIGGERS_API_SERVICE_NAME = "triggers-api"` | Default HTTP service name for trigger ingress and management APIs. |
| `TRIGGERS_API_DEFAULT_PORT` | `const TRIGGERS_API_DEFAULT_PORT = 8093` | Default HTTP port for trigger ingress and management APIs. |

## Manifest types

| Symbol | Kind | Description |
| --- | --- | --- |
| `TriggersPluginId` | type alias | Literal type for the triggers plugin id. |
| `TriggersPluginVersion` | type alias | Literal type for the triggers plugin version. |
| `TriggersApiServiceName` | type alias | Literal type for the triggers API service name. |

## Sub-path exports

The following entrypoints are published alongside the root export.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/plugin-triggers` | `./mod.ts` | Public plugin manifest surface (documented above). |
| `@netscript/plugin-triggers/public` | `./src/public/mod.ts` | Public manifest re-export (identical to the root surface). |
| `@netscript/plugin-triggers/plugin` | `./src/public/mod.ts` | Plugin lifecycle composition (alias of the public surface). |
| `@netscript/plugin-triggers/runtime` | `./src/runtime/mod.ts` | Trigger runtime wiring. |
| `@netscript/plugin-triggers/scaffolding` | `./src/scaffolding/mod.ts` | Handler-first trigger definition scaffolders (webhook, scheduled, file-watch). |
| `@netscript/plugin-triggers/aspire` | `./src/aspire/mod.ts` | Aspire contribution for trigger services and background workers. |
| `@netscript/plugin-triggers/cli` | `./src/cli/composition/main.ts` | Trigger CLI composition root. |
| `@netscript/plugin-triggers/services` | `./services/src/main.ts` | Trigger ingress/management HTTP service entrypoint. |
| `@netscript/plugin-triggers/streams` | `./streams/mod.ts` | Stream integration surface. |
| `@netscript/plugin-triggers/streams/server` | `./streams/server.ts` | Stream server entrypoint. |

### Scaffolding (`./scaffolding`)

| Symbol | Signature | Description |
| --- | --- | --- |
| `triggerScaffolder` | `function triggerScaffolder(kind): TriggerDefinitionScaffolder` | Resolve the concrete scaffolder for a trigger kind. |
| `WebhookTriggerScaffolder` | class | Scaffold a webhook trigger definition module. |
| `ScheduledTriggerScaffolder` | class | Scaffold a scheduled trigger definition module. |
| `FileWatchTriggerScaffolder` | class | Scaffold a file-watch trigger definition module. |
| `TriggerDefinitionScaffolder` | interface | Generate handler-first trigger definition modules. |
| `TriggerScaffoldInput` | type alias | Input shared by trigger definition scaffolders. |
| `TriggerScaffoldKind` | type alias | Trigger kinds supported by the F29 scaffolders. |
| `toTriggerExportName` | `function toTriggerExportName(id: string): string` | Convert a trigger id into a stable TypeScript identifier prefix. |
| `toTriggerFileStem` | `function toTriggerFileStem(id: string): string` | Convert a trigger id into the project file stem convention. |
| `renderStringArray` | `function renderStringArray(values): string` | Render an immutable string array expression. |

### Aspire (`./aspire`)

| Symbol | Kind | Description |
| --- | --- | --- |
| `TriggersAspireContribution` | class | Aspire contribution for the NetScript triggers plugin. |
| `TRIGGERS_PLUGIN_PACKAGE_NAME` | const | Package name reported by the triggers Aspire contribution. |
| `TriggersAspireBuilder` | interface | Aspire builder methods required by the triggers contribution. |
| `TriggersAspireResource` | interface | Resource returned by the triggers Aspire builder boundary. |
| `TriggersContributionContext` | interface | Contribution context required by the triggers Aspire contribution. |
| `TriggersDenoServiceSpec` | interface | Deno service resource spec used by the triggers Aspire contribution. |
| `TriggersDenoBackgroundSpec` | interface | Deno background resource spec used by the triggers Aspire contribution. |
| `TriggersHealthCheckSpec` | interface | Health check declaration emitted by the triggers Aspire contribution. |
| `TriggersEnvSource` | type alias | Environment source reference accepted by triggers Aspire declarations. |

---

## Internals

> **Internals — `@netscript/plugin-triggers-core`.** This section documents the sibling **core**
> package that backs the triggers plugin. It is the implementation surface: the handler-first
> trigger DSL, the trigger runtime (ingress + processor), the runtime ports, configuration
> schemas, and deterministic testing primitives. Application code that authors trigger
> definitions imports the DSL from here; everything below is generated from
> `@netscript/plugin-triggers-core`'s own `deno doc` surface (US-8).

### Authoring DSL

| Symbol | Signature | Description |
| --- | --- | --- |
| `defineWebhook` | `function defineWebhook(handler: WebhookHandler, spec: WebhookSpec): WebhookDefinition` | Define a webhook trigger from a handler and static spec. |
| `defineScheduledTrigger` | `function defineScheduledTrigger(handler: ScheduledTriggerHandler, spec: DefineScheduledTriggerSpec): ScheduledTriggerDefinition` | Define a scheduled trigger from a handler and static cron spec. |
| `defineFileWatch` | `function defineFileWatch(handler: FileWatchHandler, spec: FileWatchSpec): FileWatchDefinition` | Define a file-watch trigger from a handler and static spec. |
| `enqueueJob` | `function enqueueJob(job: JobDefinition, options: EnqueueJobOptions): EnqueueJobAction` | Create an action that enqueues a typed worker job from a trigger handler. |

### Runtime

| Symbol | Signature | Description |
| --- | --- | --- |
| `createTriggerIngress` | `function createTriggerIngress(options: TriggerIngressOptions): TriggerIngressPort` | Create an ack-then-process webhook ingress boundary. |
| `createTriggerProcessor` | `function createTriggerProcessor(options: TriggerProcessorOptions): TriggerProcessor` | Create a trigger processor runtime from explicit dependencies. |
| `TriggerProcessor` | class | T1 trigger processor with idempotency, retry, concurrency, DLQ, and circuit breaker handling. |

### Runtime ports

| Symbol | Kind | Description |
| --- | --- | --- |
| `TriggerIngressPort` | interface | Fast ack-then-process ingress boundary. |
| `TriggerProcessorPort` | interface | Processes unified trigger events through the T1 dispatch pipeline. |
| `TriggerSchedulerPort` | interface | Scheduler boundary for scheduled trigger definitions. |
| `TriggerEventStorePort` | interface | Persistent trigger event store boundary. |
| `TriggerIdempotencyPort` | interface | Event-boundary idempotency store with a TTL window. |
| `TriggerDlqPort` | interface | Dead-letter queue boundary for exhausted trigger events. |
| `WebhookVerifierPort` | interface | Verifies inbound webhook authenticity and extracts provider event ids. |
| `LoggerPort` | interface | Structured logger boundary consumed by trigger runtime code. |
| `TriggerActionDispatcher` | type alias | Dispatches actions emitted by trigger handlers. |
| `TriggerIngressEventIdFactory` | type alias | Generates event ids for accepted ingress events. |
| `TriggerIngressOptions` | type alias | Options accepted by the trigger ingress composition root. |
| `TriggerProcessorOptions` | type alias | Options accepted by the trigger processor runtime. |

### Trigger definitions and payloads

| Symbol | Kind | Description |
| --- | --- | --- |
| `TriggerDefinition` | type alias | Trigger definitions known by the Group F public surface. |
| `RuntimeTriggerDefinition` | type alias | Trigger definitions implemented by the Group F runtime. |
| `ProcessableTriggerDefinition` | type alias | Trigger definition accepted by runtime processor ports. |
| `WebhookDefinition` | type alias | Webhook trigger definition discovered by the runtime walker. |
| `ScheduledTriggerDefinition` | type alias | Scheduled trigger definition discovered by the runtime walker. |
| `FileWatchDefinition` | type alias | File-watch trigger definition discovered by the runtime walker. |
| `ManualTriggerDefinition` | type alias | Reserved manual trigger definition for CLI/API fire paths. |
| `QueueTriggerDefinition` | type alias | Reserved queue-source trigger definition. Runtime execution is deferred. |
| `StreamTriggerDefinition` | type alias | Reserved stream-source trigger definition. Runtime execution is deferred. |
| `TriggerDefinitionBase` | type alias | Common immutable fields shared by trigger definitions. |
| `WebhookSpec` | type alias | Webhook definition fields accepted by `defineWebhook`. |
| `ScheduledTriggerSpec` | type alias | Static scheduled trigger spec consumed by scheduler ports and builders. |
| `DefineScheduledTriggerSpec` | type alias | Scheduled trigger definition fields accepted by `defineScheduledTrigger`. |
| `FileWatchSpec` | type alias | File-watch definition fields accepted by `defineFileWatch`. |
| `WebhookHandler` | type alias | Webhook handler signature used by `defineWebhook`. |
| `ScheduledTriggerHandler` | type alias | Scheduled trigger handler signature used by `defineScheduledTrigger`. |
| `FileWatchHandler` | type alias | File-watch handler signature used by `defineFileWatch`. |
| `TriggerHandler` | type alias | Handler invoked by the processor for a trigger event. |
| `TriggerContext` | type alias | Context passed to trigger handlers by the processor. |
| `TriggerEvent` | type alias | Unified event envelope consumed by every trigger processor path. |
| `TriggerPayload` | type alias | Payload union for known Group F trigger kinds. |
| `WebhookTriggerPayload` | type alias | HTTP payload captured by webhook ingress before processing. |
| `ScheduledTriggerPayload` | type alias | Scheduled payload emitted by a scheduler adapter. |
| `FileWatchTriggerPayload` | type alias | Filesystem payload captured by a file-watch adapter. |
| `ManualTriggerPayload` | type alias | Reserved manual-fire payload for CLI and API dispatch. |
| `QueueTriggerPayload` | type alias | Reserved queue-source payload. Runtime execution is deferred. |
| `StreamTriggerPayload` | type alias | Reserved stream-source payload. Runtime execution is deferred. |
| `FileWatchLifecycle` | type alias | File lifecycle event names supported by file-watch triggers. |
| `FileWatchStabilityThreshold` | type alias | Stability threshold for network-filesystem tolerant file-watch triggers. |

### Actions, policies, and branded ids

| Symbol | Kind | Description |
| --- | --- | --- |
| `TriggerActionResult` | type alias | Action result emitted by trigger handlers. |
| `EnqueueJobAction` | type alias | Action emitted when a trigger should enqueue a worker job. |
| `EnqueueJobOptions` | type alias | Options for dispatching a worker job from a trigger handler. |
| `DeferAction` | type alias | Action emitted when a trigger yields without holding a worker slot. |
| `JobDefinition` | type alias | Root-surface job definition derived from the thin public schema. |
| `TriggerRetryPolicy` | type alias | Retry policy applied by the trigger processor before DLQ handoff. |
| `TriggerCircuitBreakerSpec` | type alias | Circuit breaker policy for repeated trigger dispatch failures. |
| `TriggerConcurrencySpec` | type alias | Bounded dispatch concurrency for a trigger definition. |
| `TriggerDeduplicationSpec` | type alias | Event-boundary deduplication policy. |
| `TriggerBackfillSpec` | type alias | Quartz-style misfire handling for scheduled trigger backfill. |
| `TriggerBackfillPolicy` | type alias | Scheduled trigger backfill misfire policy. |
| `TriggerDurabilityTier` | type alias | Trigger durability tier. |
| `CronExpression` | type alias | Cron expression accepted by scheduled trigger definitions. |
| `TriggerKind` | type alias | Open trigger discriminator. |
| `TriggerKnownKind` | type alias | Canonical known trigger kind. |
| `TriggerEventStatus` | type alias | Trigger event lifecycle status. |
| `TriggerId` | type alias | Branded trigger definition identifier. |
| `TriggerEventId` | type alias | Branded trigger event identifier. |
| `WebhookId` | type alias | Branded webhook definition identifier. |
| `JobId` | type alias | Branded worker job identifier. |
| `WebhookVerifierKind` | type alias | Webhook verifier selector declared by a webhook trigger. |
| `RuntimeWebhookDefinition` | type alias | Webhook definition shape accepted by the trigger ingress runtime. |

### Runtime constants

| Symbol | Description |
| --- | --- |
| `TRIGGER_KINDS` | Canonical trigger kinds known by Group F. |
| `TRIGGER_EVENT_STATUSES` | Trigger event lifecycle statuses. |
| `TRIGGER_DURABILITY_TIERS` | Durability tiers supported by trigger definitions. |
| `TRIGGER_BACKFILL_POLICIES` | Scheduled trigger backfill misfire policies. |

### DLQ, event-store, and idempotency support types

| Symbol | Kind | Description |
| --- | --- | --- |
| `TriggerDlqEntry` | type alias | Dead-letter entry recorded after trigger retry exhaustion. |
| `TriggerDlqListOptions` | type alias | Dead-letter list filters. |
| `TriggerEventListOptions` | type alias | Event store list filters. |
| `TriggerIdempotencyClaim` | type alias | Idempotency claim result. |
| `TriggerIdempotencyKeyInput` | type alias | Idempotency key resolution input. |
| `TriggerIngressRequest` | type alias | Ingress request passed to trigger ingress adapters. |
| `TriggerIngressResponse` | type alias | Fast ack response returned by ingress adapters. |
| `TriggerProcessResult` | type alias | Result returned after processing a trigger event. |
| `TriggerProcessorStopOptions` | type alias | Stop options for processor drain. |
| `TriggerSchedulerStopOptions` | type alias | Scheduler stop options. |
| `ScheduledTriggerHandle` | type alias | Scheduled trigger handle returned by scheduler adapters. |
| `WebhookVerificationRequest` | type alias | Request shape passed to a webhook verifier adapter. |
| `WebhookVerificationResult` | type alias | Result returned by a webhook verifier adapter. |

### Internals sub-path exports

The core package publishes the following sub-path entrypoints. Each is generated from its own
`deno doc` surface.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/plugin-triggers-core` | `./mod.ts` | Curated root surface (DSL, runtime, ports, types — documented above). |
| `@netscript/plugin-triggers-core/public` | `./src/public/mod.ts` | Public root re-export. |
| `@netscript/plugin-triggers-core/builders` | `./src/builders/mod.ts` | Handler-first definition builders (`defineWebhook`, `defineScheduledTrigger`, `defineFileWatch`, `enqueueJob`) and `TRIGGER_*` constants. |
| `@netscript/plugin-triggers-core/config` | `./src/config/mod.ts` | `netscript.config.ts` trigger schemas and `defineTriggers`. |
| `@netscript/plugin-triggers-core/domain` | `./src/domain/mod.ts` | Domain definitions, payloads, and branded ids. |
| `@netscript/plugin-triggers-core/ports` | `./src/ports/mod.ts` | Runtime port boundaries. |
| `@netscript/plugin-triggers-core/runtime` | `./src/runtime/mod.ts` | Ingress and processor runtime. |
| `@netscript/plugin-triggers-core/adapters` | `./src/adapters/mod.ts` | Concrete port adapters. |
| `@netscript/plugin-triggers-core/telemetry` | `./src/telemetry/mod.ts` | Trigger telemetry instrumentation. |
| `@netscript/plugin-triggers-core/contracts/v1` | `./src/contracts/v1/mod.ts` | Versioned wire contracts. |
| `@netscript/plugin-triggers-core/testing` | `./src/testing/mod.ts` | Deterministic in-memory adapters, stores, and clock for trigger tests. |

---

Back to the [reference overview](/reference/).
