import { assertEquals } from 'jsr:@std/assert@^1';
import { FakeTime } from 'jsr:@std/testing@^1/time';
import { MemoryKvAdapter } from '@netscript/kv';
import type { SagaInstanceId } from '@netscript/plugin-sagas-core/domain';
import {
  KvSagaInstanceProjection,
  PrismaSagaInstanceProjection,
  type SagaInstanceProjection,
} from './saga-instance-projection.ts';

Deno.test('saga query projection survives while open, expires after terminal window, and honors archiveToDb false', async () => {
  using time = new FakeTime('2026-10-10T00:00:00Z');
  await using kv = new MemoryKvAdapter();
  const projection = new KvSagaInstanceProjection(kv, () => 1);
  let archived = 0;
  const archive = new PrismaSagaInstanceProjection({
    sagaInstance: {
      upsert: () => {
        archived++;
        return Promise.resolve();
      },
    },
  }, () => false);
  const now = new Date();
  const input: SagaInstanceProjection = {
    sagaId: 'saga',
    instanceId: 'instance',
    correlationKey: 'one',
    envelope: {
      state: { count: 1 },
      metadata: {
        instanceId: 'instance' as SagaInstanceId,
        version: 1,
        status: 'running',
        durability: 't1',
        createdAt: now,
        updatedAt: now,
      },
    },
    transition: {
      version: 1,
      transition: {
        from: {},
        to: { count: 1 },
        status: 'running',
        message: { type: 'Tick', payload: {} },
        occurredAt: now,
      },
    },
  };
  await projection.upsert(input);
  await archive.upsert(input);
  time.tick(2 * 86_400_000);
  assertEquals((await kv.get(['saga_instances', 'saga', 'instance']))?.value !== null, true);
  const terminal: SagaInstanceProjection = {
    ...input,
    envelope: {
      ...input.envelope,
      metadata: {
        ...input.envelope.metadata,
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    },
  };
  await projection.upsert(terminal);
  await archive.upsert(terminal);
  time.tick(86_400_001);
  assertEquals(await kv.get(['saga_instances', 'saga', 'instance']), null);
  assertEquals(archived, 0);
});

Deno.test('saga KV projection uses its injected clock for the terminal deadline', async () => {
  await using kv = new MemoryKvAdapter();
  let now = new Date('2030-01-01T00:00:00Z');
  const projection = new KvSagaInstanceProjection(kv, () => 1, () => now);
  const input: SagaInstanceProjection = {
    sagaId: 'clock',
    instanceId: 'one',
    correlationKey: 'one',
    envelope: {
      state: {},
      metadata: {
        instanceId: 'one' as SagaInstanceId,
        version: 1,
        status: 'completed',
        durability: 't1',
        createdAt: now,
        updatedAt: now,
        completedAt: now,
      },
    },
    transition: {
      version: 1,
      transition: {
        from: {},
        to: {},
        status: 'completed',
        message: { type: 'Done', payload: {} },
        occurredAt: now,
      },
    },
  };
  await projection.upsert(input);
  assertEquals((await kv.get(['saga_instances', 'clock', 'one']))?.value !== undefined, true);
  now = new Date(now.getTime() + 86_400_001);
  await projection.upsert(input);
  assertEquals(await kv.get(['saga_instances', 'clock', 'one']), null);
});
