import { assertEquals } from '@std/assert';

import { defineSaga, send } from '../../mod.ts';
import type { SagaMessage, SagaState } from '../../src/domain/mod.ts';
import { SagaBusLegacy, type SagaBusLegacyBus } from '../../src/adapters/mod.ts';
import type { SagaIdempotencyPort } from '../../src/ports/mod.ts';
import {
  createSagaRuntime,
  MemorySagaIdempotencyStore,
  SagaIdempotencyDedupTable,
  type SagaIdempotencyReservation,
  type SagaIdempotencyTarget,
} from '../../src/runtime/mod.ts';

Deno.test('SagaIdempotencyDedupTable reserves target-key tuples until ttl expiry', () => {
  let now = new Date('2026-01-01T00:00:00.000Z');
  const table = new SagaIdempotencyDedupTable({
    ttlMs: 1_000,
    now: () => now,
  });
  const target = { kind: 'message', id: 'roundtrip.started' };

  assertEquals(table.reserve(target, 'same-key').accepted, true);
  assertEquals(table.reserve(target, 'same-key').accepted, false);
  assertEquals(table.reserve({ ...target, id: 'roundtrip.other' }, 'same-key').accepted, true);

  now = new Date('2026-01-01T00:00:01.001Z');

  assertEquals(table.reserve(target, 'same-key').accepted, true);
  assertEquals(table.size(), 1);
});

Deno.test('native runtime deduplicates direct publishes by message target and idempotency key', async () => {
  let handled = 0;
  const runtime = createSagaRuntime();
  const definition = defineCountingSaga('direct.publish', 'roundtrip.started', () => {
    handled += 1;
  }).build();

  await runtime.start();
  try {
    await runtime.register([definition]);
    await runtime.publish(message('roundtrip.started', 'same-key'));
    await runtime.publish(message('roundtrip.started', 'same-key'));
    await runtime.publish(message('roundtrip.started', 'next-key'));

    assertEquals(handled, 2);
  } finally {
    await runtime.stop('idempotency test complete');
  }
});

Deno.test('native runtime uses injected durable idempotency port', async () => {
  let handled = 0;
  const idempotency = new RecordingIdempotencyStore();
  const runtime = createSagaRuntime({ native: { idempotency } });
  const definition = defineCountingSaga('direct.publish', 'roundtrip.started', () => {
    handled += 1;
  }).build();

  await runtime.start();
  try {
    await runtime.register([definition]);
    await runtime.publish(message('roundtrip.started', 'same-key'));
    await runtime.publish(message('roundtrip.started', 'same-key'));

    assertEquals(handled, 1);
    assertEquals(idempotency.reservedKeys, ['message:roundtrip.started:same-key']);
    assertEquals(idempotency.duplicateKeys, ['message:roundtrip.started:same-key']);
  } finally {
    await runtime.stop('durable idempotency test complete');
  }
});

Deno.test('MemorySagaIdempotencyStore is local-only adapter compatible with the durable port', async () => {
  const store: SagaIdempotencyPort = new MemorySagaIdempotencyStore();
  const target = { kind: 'message', id: 'roundtrip.started' };

  assertEquals((await store.reserve(target, 'same-key')).accepted, true);
  assertEquals((await store.reserve(target, 'same-key')).accepted, false);
});

Deno.test('native runtime deduplicates cascaded sends by target and idempotency key', async () => {
  const handled: string[] = [];
  const runtime = createSagaRuntime();
  const definition = defineCountingSaga('cascaded.send', 'roundtrip.triggered', (event) => {
    handled.push(event.type);
  })
    .on<string, unknown>('roundtrip.other', (_saga, event) => {
      handled.push(event.type);
      return [];
    })
    .build();

  await runtime.start();
  try {
    await runtime.register([definition]);
    await runtime.dispatchCascaded([
      send('roundtrip.triggered', {}, { idempotencyKey: 'same-key' }),
      send('roundtrip.triggered', {}, { idempotencyKey: 'same-key' }),
      send('roundtrip.other', {}, { idempotencyKey: 'same-key' }),
    ]);

    assertEquals(handled, ['roundtrip.triggered', 'roundtrip.other']);
  } finally {
    await runtime.stop('idempotency test complete');
  }
});

Deno.test('legacy adapter deduplicates cascaded sends before publishing to upstream bus', async () => {
  const bus = new RecordingLegacyBus();
  const adapter = new SagaBusLegacy({ bus });

  await adapter.dispatchCascaded([
    send('roundtrip.triggered', {}, { idempotencyKey: 'same-key' }),
    send('roundtrip.triggered', {}, { idempotencyKey: 'same-key' }),
    send('roundtrip.other', {}, { idempotencyKey: 'same-key' }),
  ]);

  assertEquals(bus.publishedMessages().map((item) => readMessageType(item)), [
    'roundtrip.triggered',
    'roundtrip.other',
  ]);
});

function defineCountingSaga(
  sagaId: string,
  eventType: string,
  observe: (event: SagaMessage<string, unknown>) => void,
) {
  const initialState: SagaState = {};
  return defineSaga(sagaId)
    .state(initialState)
    .on<string, unknown>(eventType, (_saga, event) => {
      observe(event);
      return [];
    });
}

function message(type: string, idempotencyKey: string): SagaMessage<string, Record<string, never>> {
  return Object.freeze({
    type,
    payload: {},
    idempotencyKey,
  });
}

function readMessageType(value: unknown): string {
  if (!isRecord(value) || typeof value.type !== 'string') {
    throw new TypeError('Recorded legacy message did not include a string type.');
  }
  return value.type;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

class RecordingLegacyBus implements SagaBusLegacyBus {
  readonly #published: unknown[] = [];

  start(): Promise<void> {
    return Promise.resolve();
  }

  stop(): Promise<void> {
    return Promise.resolve();
  }

  publish(message: unknown): Promise<void> {
    this.#published.push(message);
    return Promise.resolve();
  }

  publishedMessages(): readonly unknown[] {
    return Object.freeze([...this.#published]);
  }
}

class RecordingIdempotencyStore implements SagaIdempotencyPort {
  readonly reservedKeys: string[] = [];
  readonly duplicateKeys: string[] = [];
  readonly #keys = new Set<string>();

  reserve(
    target: SagaIdempotencyTarget,
    idempotencyKey: string,
  ): Promise<SagaIdempotencyReservation> {
    const key = `${target.kind}:${target.id}:${idempotencyKey}`;
    const accepted = !this.#keys.has(key);
    if (accepted) {
      this.#keys.add(key);
      this.reservedKeys.push(key);
    } else {
      this.duplicateKeys.push(key);
    }
    return Promise.resolve({
      accepted,
      key,
      expiresAt: new Date('2026-01-02T00:00:00.000Z'),
    });
  }
}
