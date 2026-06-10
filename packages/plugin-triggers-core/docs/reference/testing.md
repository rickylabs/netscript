# Testing Reference

The testing subpath provides deterministic adapters for runtime tests.

Use these adapters before introducing production services into a package test.

## Clock

```ts
import { assertEquals } from 'jsr:@std/assert@^1';
import { TriggerTestClock } from '../../src/testing/mod.ts';

const clock = new TriggerTestClock(new Date('2026-01-01T00:00:00.000Z'));
clock.advanceBy(500);

assertEquals(clock.now().toISOString(), '2026-01-01T00:00:00.500Z');
```

## Event Stores

`MemoryTriggerEventStore` stores events in insertion order.

`RecordingTriggerEventStore` records operations for assertions.

`KvTriggerEventStore` wraps a caller-provided Deno KV handle.

Use the memory store for unit tests.

Use the recording store when call order matters.

Use the KV store only when the test intentionally covers KV behavior.

## Idempotency Store

`MemoryTriggerIdempotencyStore` implements duplicate claims in memory.

It is enough for processor retry and dedup tests.

Production stores should implement the same port behind durable storage.

## Scheduler Adapter

`MemoryTriggerSchedulerAdapter` captures scheduled handlers.

Tests can fire the captured handlers manually.

This keeps scheduled behavior deterministic.

## File Watch Adapter

`MemoryFileWatcherAdapter` captures file-watch handlers.

Tests can emit create, modify, and delete events manually.

This avoids filesystem watchers in package tests.

## Inline Processor

`InlineTriggerProcessor` implements the processor port without background workers.

It is useful for ingress tests.

Ingress tests can verify that an accepted event reaches the processor.

## Test Pattern

Build a trigger definition.

Create memory ports.

Inject the ports into the runtime function under test.

Assert stored events, idempotency claims, and emitted actions.

Keep production adapters out of fast package tests.
