# Ports Reference

Ports are the runtime extension boundary for trigger behavior.

They describe what the processor and ingress need.

They do not prescribe the storage, scheduler, watcher, or queue implementation.

## Clock

```ts
import { assertEquals } from 'jsr:@std/assert@^1';
import type { TriggerClockPort } from '../../src/ports/mod.ts';

const clock: TriggerClockPort = {
  now: () => new Date('2026-01-01T00:00:00.000Z'),
  sleep: () => Promise.resolve(),
};

assertEquals(clock.now().toISOString(), '2026-01-01T00:00:00.000Z');
```

## Event Store

`TriggerEventStorePort` persists accepted trigger events.

It supports save, load, status update, and list operations.

The processor uses it to track lifecycle state.

The service uses it to expose event APIs.

## Idempotency

`TriggerIdempotencyPort` claims deduplication keys.

It lets the processor avoid duplicate action dispatch.

Production implementations can use KV, Redis, or a database.

Tests can use `MemoryTriggerIdempotencyStore`.

## Scheduler

`TriggerSchedulerPort` registers scheduled definitions.

It returns handles that can be stopped.

The core package does not import a cron library.

The plugin package adapts the production scheduler.

## File Watcher

`FileWatcherPort` registers file-watch definitions.

It returns handles that can be stopped.

The core package does not import a watcher library.

The plugin package adapts the production watcher.

## Processor

`TriggerProcessorPort` processes accepted events.

Ingress depends on this port.

Tests can replace it with `InlineTriggerProcessor`.

## Webhook Verifier

`WebhookVerifierPort` validates webhook signatures.

The memory verifier is useful for tests.

The HMAC verifier is useful for production-style verification.

## DLQ

`TriggerDlqPort` receives exhausted events.

The processor calls it after retry policy is exhausted.

The concrete backend is intentionally caller-owned.
