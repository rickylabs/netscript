---
layout: layouts/base.vto
title: "@netscript/plugin-triggers-core"
---

# `@netscript/plugin-triggers-core`

Trigger DSL, runtime ports, adapters, telemetry, config, and testing primitives for NetScript trigger
plugins. This page is written against the package's public surface reported by `deno doc`. For
the full index of packages and plugins return to the [reference overview](/reference/).

The hard part of triggers is not receiving them — it is surviving them: duplicate webhooks, senders
that retry on a slow response, crashes between the acknowledgement and the work. `defineWebhook`,
`defineScheduledTrigger`, and `defineFileWatch` take the handler first and a frozen spec second;
ingress verifies and persists an event before responding `202`; and the processor applies
idempotency, retry policy, bounded concurrency, dead-lettering, and circuit-breaking around every
dispatch — all through explicit ports you can swap.

This is the core that the deployable [`@netscript/plugin-triggers`](/reference/triggers/) plugin binds
to a NetScript host. Use it directly for custom hosts, libraries, and tests.

## Exports

| Export specifier | Module | Exports | Purpose |
| --- | --- | --- | --- |
| `@netscript/plugin-triggers-core` | `./mod.ts` | 106 | The full public surface — builders, runtime factories, ports, and the event model (documented below). |
| `@netscript/plugin-triggers-core/public` | `./src/public/mod.ts` | 106 | The same curated public surface the root re-exports, for consumers that prefer to name it explicitly. |
| `@netscript/plugin-triggers-core/builders` | `./src/builders/mod.ts` | 50 | The three definition builders and the handler-action constructors (`enqueueJob`). |
| `@netscript/plugin-triggers-core/domain` | `./src/domain/mod.ts` | 69 | Trigger domain vocabulary and policy defaults (concurrency limit, idempotency TTL, circuit-breaker thresholds, backoff multiplier). |
| `@netscript/plugin-triggers-core/ports` | `./src/ports/mod.ts` | 80 | The port interfaces the runtime depends on — event store, DLQ, idempotency, enabled-state, scheduler, verifier, subscription. |
| `@netscript/plugin-triggers-core/runtime` | `./src/runtime/mod.ts` | 97 | The runtime factories — `createTriggerIngress`, `createTriggerProcessor`, `createManualDispatcher`, `createEventSubscription`, `defaultRetryPolicy`. |
| `@netscript/plugin-triggers-core/adapters` | `./src/adapters/mod.ts` | 28 | Concrete adapters: the cron scheduler adapter, the file-watcher port, and the HMAC-SHA256 webhook verifier. |
| `@netscript/plugin-triggers-core/stores` | `./src/stores/mod.ts` | 40 | KV-backed store implementations and `openTriggerRuntimeKv`. |
| `@netscript/plugin-triggers-core/config` | `./src/config/mod.ts` | 17 | `defineTriggers` and the trigger configuration schemas. |
| `@netscript/plugin-triggers-core/contracts/v1` | `./src/contracts/v1/mod.ts` | 35 | Version 1 trigger API schemas and contract route types (`triggersContract`, `triggersContractV1`). |
| `@netscript/plugin-triggers-core/telemetry` | `./src/telemetry/mod.ts` | 37 | `createTriggerInstrumentation`, span names, and attribute keys for trigger dispatch. |
| `@netscript/plugin-triggers-core/testing` | `./src/testing/mod.ts` | 79 | In-memory and KV store doubles for deterministic runtime verification. |

Export counts are the symbol counts `deno doc` reports for each entrypoint; the layered subpaths
re-export shared vocabulary, so the counts overlap rather than sum.

## Root surface (`@netscript/plugin-triggers-core`)

### Defining triggers

Each builder takes the **handler first** and an immutable spec second, and returns a frozen
definition the runtime walker discovers.

| Symbol | Kind | Description |
| --- | --- | --- |
| `defineWebhook` | function | Define a webhook trigger from a handler and static spec. |
| `WebhookHandler` | type alias | Webhook handler signature used by `defineWebhook`. |
| `WebhookSpec` | type alias | Webhook definition fields accepted by `defineWebhook`. |
| `WebhookDefinition` | type alias | Webhook trigger definition discovered by the runtime walker. |
| `defineScheduledTrigger` | function | Define a scheduled trigger from a handler and static cron spec. |
| `ScheduledTriggerHandler` | type alias | Scheduled trigger handler signature used by `defineScheduledTrigger`. |
| `DefineScheduledTriggerSpec` | type alias | Scheduled trigger definition fields accepted by `defineScheduledTrigger`. |
| `ScheduledTriggerSpec` | type alias | Static scheduled trigger spec consumed by scheduler ports and builders. |
| `ScheduledTriggerDefinition` | type alias | Scheduled trigger definition discovered by the runtime walker. |
| `defineFileWatch` | function | Define a file-watch trigger from a handler and static spec. |
| `FileWatchHandler` | type alias | File-watch handler signature used by `defineFileWatch`. |
| `FileWatchSpec` | type alias | File-watch definition fields accepted by `defineFileWatch`. |
| `FileWatchDefinition` | type alias | File-watch trigger definition discovered by the runtime walker. |
| `FileWatchLifecycle` | type alias | File lifecycle event names supported by file-watch triggers. |
| `FileWatchStabilityThreshold` | type alias | Stability threshold for network-filesystem tolerant file-watch triggers. |
| `CronExpression` | type alias | Cron expression accepted by scheduled trigger definitions. |

### Handler context and actions

A handler does not perform work directly; it returns **actions** the dispatcher carries out.

| Symbol | Kind | Description |
| --- | --- | --- |
| `TriggerContext` | type alias | Context passed to trigger handlers by the processor. |
| `TriggerHandler` | type alias | Handler invoked by the processor for a trigger event. |
| `TriggerActionResult` | type alias | Action result emitted by trigger handlers. |
| `TriggerActionDispatcher` | type alias | Dispatches actions emitted by trigger handlers. |
| `enqueueJob` | function | Create an action that enqueues a typed worker job from a trigger handler. |
| `EnqueueJobAction` | type alias | Action emitted when a trigger should enqueue a worker job. |
| `EnqueueJobOptions` | type alias | Options for dispatching a worker job from a trigger handler. |
| `DeferAction` | type alias | Action emitted when a trigger yields without holding a worker slot. |
| `JobDefinition` | type alias | Root-surface job definition derived from the thin public schema. |
| `JobId` | type alias | Branded worker job identifier. |

### Definition union and kinds

| Symbol | Kind | Description |
| --- | --- | --- |
| `TriggerDefinition` | type alias | Implemented and reserved trigger definitions exposed by the public API. |
| `TriggerDefinitionBase` | type alias | Common immutable fields shared by trigger definitions. |
| `TriggerKind` | type alias | Open trigger discriminator. |
| `TriggerKnownKind` | type alias | Canonical known trigger kind. |
| `TRIGGER_KINDS` | variable | Canonical trigger kinds exposed by trigger definitions. |
| `ProcessableTriggerDefinition` | type alias | Trigger definition accepted by runtime processor ports. |
| `RuntimeTriggerDefinition` | type alias | Trigger definitions accepted by the current runtime processor. |
| `RuntimeWebhookDefinition` | type alias | Webhook definition shape accepted by the trigger ingress runtime. |
| `TriggerId` | type alias | Branded trigger definition identifier. |
| `WebhookId` | type alias | Branded webhook definition identifier. |

`TriggerKind` is deliberately **open** while `TriggerKnownKind` is closed: a host may carry a kind the
core does not implement, and only the known kinds narrow into `RuntimeTriggerDefinition`.

### Payloads

| Symbol | Kind | Description |
| --- | --- | --- |
| `TriggerPayload` | type alias | Payload union for canonical trigger kinds. |
| `WebhookTriggerPayload` | type alias | HTTP payload captured by webhook ingress before processing. |
| `ScheduledTriggerPayload` | type alias | Scheduled payload emitted by a scheduler adapter. |
| `FileWatchTriggerPayload` | type alias | Filesystem payload captured by a file-watch adapter. |

### Reserved kinds

These are declared in the type surface but **not executed** by the current runtime. They exist so a
host can carry the shape without the core pretending to run it.

| Symbol | Kind | Description |
| --- | --- | --- |
| `ManualTriggerDefinition` | type alias | Reserved manual trigger definition for CLI/API fire paths. |
| `ManualTriggerPayload` | type alias | Reserved manual-fire payload for CLI and API dispatch. |
| `QueueTriggerDefinition` | type alias | Reserved queue-source trigger definition; runtime execution is deferred. |
| `QueueTriggerPayload` | type alias | Reserved queue-source payload; runtime execution is deferred. |
| `StreamTriggerDefinition` | type alias | Reserved stream-source trigger definition; runtime execution is deferred. |
| `StreamTriggerPayload` | type alias | Reserved stream-source payload; runtime execution is deferred. |

### Ingress

| Symbol | Kind | Description |
| --- | --- | --- |
| `createTriggerIngress` | function | Create an ack-then-process webhook ingress boundary. |
| `TriggerIngressPort` | interface | Fast ack-then-process ingress boundary. |
| `TriggerIngressOptions` | type alias | Options accepted by the trigger ingress composition root. |
| `TriggerIngressRequest` | type alias | Ingress request passed to trigger ingress adapters. |
| `TriggerIngressResponse` | type alias | Fast ack response returned by ingress adapters. |
| `TriggerIngressEventIdFactory` | type alias | Generates event ids for accepted ingress events. |

Ingress **verifies the signature and persists the event before responding**. That ordering is the
contract: a slow handler never blocks the sender, and a crash after the acknowledgement replays from
the stored event rather than losing it.

### Processor

| Symbol | Kind | Description |
| --- | --- | --- |
| `createTriggerProcessor` | function | Create a trigger processor runtime from explicit dependencies. |
| `TriggerProcessor` | class | Trigger processor with idempotency, retry, concurrency, DLQ, and circuit breaker handling. |
| `TriggerProcessorPort` | interface | Processes unified trigger events through the runtime dispatch pipeline. |
| `TriggerProcessorOptions` | type alias | Options accepted by the trigger processor runtime. |
| `TriggerProcessorStopOptions` | type alias | Stop options for processor drain. |
| `TriggerProcessResult` | type alias | Result returned after processing a trigger event. |

### Dispatch policies

| Symbol | Kind | Description |
| --- | --- | --- |
| `TriggerRetryPolicy` | type alias | Retry policy applied by the trigger processor before DLQ handoff. |
| `TriggerConcurrencySpec` | type alias | Bounded dispatch concurrency for a trigger definition. |
| `TriggerDeduplicationSpec` | type alias | Event-boundary deduplication policy. |
| `TriggerCircuitBreakerSpec` | type alias | Circuit breaker policy for repeated trigger dispatch failures. |
| `TriggerDurabilityTier` | type alias | Trigger durability tier. |
| `TRIGGER_DURABILITY_TIERS` | variable | Durability tiers supported by trigger definitions. |

### Events, stores, and idempotency

| Symbol | Kind | Description |
| --- | --- | --- |
| `TriggerEvent` | type alias | Unified event envelope consumed by every trigger processor path. |
| `TriggerEventId` | type alias | Branded trigger event identifier. |
| `TriggerEventStatus` | type alias | Trigger event lifecycle status. |
| `TRIGGER_EVENT_STATUSES` | variable | Trigger event lifecycle statuses. |
| `TriggerEventStorePort` | interface | Persistent trigger event store boundary. |
| `TriggerEventListOptions` | type alias | Event store list filters. |
| `TriggerDlqPort` | interface | Dead-letter queue boundary for exhausted trigger events. |
| `TriggerDlqEntry` | type alias | Dead-letter entry recorded after trigger retry exhaustion. |
| `TriggerDlqListOptions` | type alias | Dead-letter list filters. |
| `TriggerIdempotencyPort` | interface | Event-boundary idempotency store with a TTL window. |
| `TriggerIdempotencyClaim` | type alias | Idempotency claim result. |
| `TriggerIdempotencyKeyInput` | type alias | Idempotency key resolution input. |
| `TriggerEnabledStatePort` | interface | Persistent enabled-state boundary for trigger enable/disable routes. |
| `TriggerEnabledStateOverride` | type alias | Stored enabled-state override for a trigger definition. |
| `createKvTriggerEnabledStateStore` | function | Create a KV-backed enabled-state store over the supplied adapter. |

Every kind — webhook, scheduled, file-watch — converges on the same `TriggerEvent` envelope, which is
why one processor pipeline covers all of them.

### Live event subscription

| Symbol | Kind | Description |
| --- | --- | --- |
| `createEventSubscription` | function | Create a single-replica in-process trigger event subscription hub. |
| `TriggerEventSubscriptionPort` | interface | In-process live trigger event subscription boundary. |
| `TriggerEventSubscriptionFilter` | type alias | Subscription filter for live trigger event streams. |
| `TriggerEventSubscriptionMessage` | type alias | Message yielded by trigger event subscription ports. |
| `TriggerEventSubscriptionOptions` | type alias | Subscribe options for live trigger event streams. |
| `TriggerEventSubscriptionType` | type alias | Trigger lifecycle event emitted to live subscribers. |

`createEventSubscription` is explicitly **single-replica** and in-process: it is a live-tail hub for
one host, not a distributed fan-out.

### Scheduling

| Symbol | Kind | Description |
| --- | --- | --- |
| `TriggerSchedulerPort` | interface | Scheduler boundary for scheduled trigger definitions. |
| `TriggerSchedulerStopOptions` | type alias | Scheduler stop options. |
| `ScheduledTriggerHandle` | type alias | Scheduled trigger handle returned by scheduler adapters. |
| `computeNextFireTimes` | function | Compute upcoming fire times for a 5-field scheduled trigger spec. |

`computeNextFireTimes` is a pure preview over a **5-field** cron spec — it starts no scheduler and is
what the CLI and dashboards use to show "next runs".

### Manual dispatch

| Symbol | Kind | Description |
| --- | --- | --- |
| `createManualDispatcher` | function | Create a manual trigger dispatcher from explicit runtime ports. |
| `ManualDispatcher` | interface | Runtime port for explicit manual trigger dispatch. |
| `ManualDispatcherOptions` | type alias | Options accepted by the manual trigger dispatcher factory. |
| `ManualTriggerFireInput` | type alias | Manual trigger fire request consumed by the runtime dispatcher. |
| `ManualTriggerFireResponse` | type alias | Manual trigger fire response returned by the runtime dispatcher. |
| `ManualTriggerEventIdFactory` | type alias | Generates event ids for manual trigger fire events. |

### Webhook verification and test delivery

| Symbol | Kind | Description |
| --- | --- | --- |
| `WebhookVerifierPort` | interface | Verifies inbound webhook authenticity and extracts provider event ids. |
| `WebhookVerifierKind` | type alias | Webhook verifier selector declared by a webhook trigger. |
| `WebhookVerificationRequest` | type alias | Request shape passed to a webhook verifier adapter. |
| `WebhookVerificationResult` | type alias | Result returned by a webhook verifier adapter. |
| `createWebhookTestDelivery` | function | Create a webhook test-delivery helper over an ingress port. |
| `WebhookTestDelivery` | interface | Runtime helper for sending signed synthetic webhook test requests. |
| `WebhookTestDeliveryDefinition` | type alias | Webhook definition shape accepted by the test-delivery helper. |
| `WebhookTestDeliveryInput` | type alias | Webhook test delivery request consumed by the runtime helper. |
| `WebhookTestDeliveryOptions` | type alias | Options accepted by the webhook test-delivery helper factory. |
| `WebhookTestDeliveryResponse` | type alias | Webhook test delivery response mapped to the trigger fire contract shape. |

A verifier extracts the **provider event id** as well as validating the signature; that id is what
lets deduplication recognize the sender's retry as the same event.

`@netscript/plugin-triggers-core/adapters` ships `HmacSha256WebhookVerifier` as the default
implementation of `WebhookVerifierPort`.

### Logging

| Symbol | Kind | Description |
| --- | --- | --- |
| `LoggerPort` | interface | Structured logger boundary consumed by trigger runtime code. |

## Related pages

- [`@netscript/plugin-triggers`](/reference/triggers/) — the deployable plugin that binds this core to
  a NetScript host.
- [`@netscript/plugin-workers-core`](/reference/plugin-workers-core/) — the job surface `enqueueJob`
  hands work to.

---

Back to the [reference overview](/reference/).
