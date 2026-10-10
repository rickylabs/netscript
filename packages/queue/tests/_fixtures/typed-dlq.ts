import { assertEquals } from '@std/assert';
import { deadline } from '@std/async';
import { z } from 'zod';
import { createTypedQueue } from '../../factory/create-typed-queue.ts';
import { createEnvelope } from '../../adapters/_envelope.ts';
import { KvDeadLetterStore } from '../../adapters/kv-dead-letter-store.ts';
import { type DeadLetterStorePort, QueueProvider } from '../../ports/mod.ts';
import { MemoryDeadLetterStore } from '../../testing/mod.ts';

/** Exercise the typed validation nack while its DLQ write is held across cancellation. */
export async function typedDlqDrain(): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'typed-dlq-' });
  const written = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const deadLetters = new MemoryDeadLetterStore<unknown>();
  let appendCompleted = false;
  const store: DeadLetterStorePort = {
    async append(record) {
      await deadLetters.append(record);
      written.resolve();
      await release.promise;
      appendCompleted = true;
    },
    list: (options) => deadLetters.list(options),
    depth: () => deadLetters.depth(),
    reprocess: (enqueue, options) => deadLetters.reprocess(enqueue, options),
  };
  const queue = createTypedQueue('typed-dlq', z.object({ id: z.string() }), {
    provider: QueueProvider.DenoKv,
    autoDiscover: false,
    validateOnEnqueue: false,
    onValidationError: 'dlq',
    connection: { denoKv: { path: `${dir}/kv.sqlite` } },
    deadLetterStore: store,
    disableAutoTracing: true,
  });
  const controller = new AbortController();
  const listening = queue.listen(() => {
    throw new Error('handler should not receive invalid message');
  }, { signal: controller.signal }).then(() => {
    assertEquals(appendCompleted, true, 'listen must drain the validation nack');
  });
  try {
    await queue.enqueue({ id: 123 } as never);
    await deadline(written.promise, 5_000);
    controller.abort();
    const stopped = queue.stop().then(() => {
      assertEquals(appendCompleted, true, 'stop must drain the validation nack');
    });
    release.resolve();
    await deadline(Promise.all([listening, stopped]), 5_000);

    const records = await deadLetters.list();
    assertEquals(records.length, 1);
    assertEquals(records[0].queueName, 'typed-dlq');
    assertEquals(records[0].payload, { id: 123 });
    assertEquals(records[0].reason, 'validation_failed');
    assertEquals(records[0].errorCode, 'VALIDATION_ERROR');
  } finally {
    controller.abort();
    release.resolve();
    await queue.stop();
    await listening;
    await Deno.remove(dir, { recursive: true });
  }
}

/** Force a persisted nack to lose its acknowledgement, then abort during native redelivery. */
export async function typedDlqRedelivery(backend: 'memory' | 'kv'): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'typed-dlq-redelivery-' });
  const path = `${dir}/kv.sqlite`;
  const kv = await Deno.openKv(path);
  const deadLetters: DeadLetterStorePort = backend === 'kv'
    ? new KvDeadLetterStore({ queueName: 'typed-dlq', denoKv: kv })
    : new MemoryDeadLetterStore();
  const redelivered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const lostAck = new Error('injected lost acknowledgement after DLQ persistence');
  let calls = 0;
  let appendCompleted = false;
  const store: DeadLetterStorePort = {
    async append(record) {
      calls++;
      // Different timestamps make duplicate identity independent of wall-clock precision.
      await deadLetters.append({ ...record, failedAt: `2026-10-01T00:00:0${calls}.000Z` });
      if (calls === 1) throw lostAck;
      redelivered.resolve();
      await release.promise;
      appendCompleted = true;
    },
    list: (options) => deadLetters.list(options),
    depth: () => deadLetters.depth(),
    reprocess: (enqueue, options) => deadLetters.reprocess(enqueue, options),
  };
  const queue = createTypedQueue('typed-dlq', z.object({ id: z.string() }), {
    provider: QueueProvider.DenoKv,
    autoDiscover: false,
    validateOnEnqueue: false,
    onValidationError: 'dlq',
    connection: { denoKv: { path } },
    deadLetterStore: store,
    disableAutoTracing: true,
  });
  const controller = new AbortController();
  const envelope = createEnvelope({ id: 123 }, undefined, 'typed-dlq');
  const listening = queue.listen(() => {
    throw new Error('handler should not receive invalid message');
  }, { signal: controller.signal }).then(() => {
    assertEquals(appendCompleted, true, 'redelivery must drain before listen returns');
  });
  try {
    // Deno owns the retry; zero backoff is an ordering fixture, never a retry-until-pass loop.
    await kv.enqueue(envelope, { backoffSchedule: [0] });
    await deadline(redelivered.promise, 5_000);
    controller.abort();
    release.resolve();
    await deadline(listening, 5_000);
    await queue.stop();

    assertEquals(calls, 2, 'native KV must redeliver the same envelope exactly once');
    const records = await deadLetters.list();
    assertEquals(records.length, 1, 'one terminal record per message despite lost acknowledgement');
    assertEquals(records[0].messageId, envelope.messageId);
    assertEquals(records[0].failedAt, '2026-10-01T00:00:01.000Z');
    assertEquals(records[0].reason, 'validation_failed');
    assertEquals(records[0].errorCode, 'VALIDATION_ERROR');
  } finally {
    controller.abort();
    release.resolve();
    await queue.stop();
    await listening;
    kv.close();
    await Deno.remove(dir, { recursive: true });
  }
}
