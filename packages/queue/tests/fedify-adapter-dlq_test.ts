import { assertEquals } from '@std/assert';
import { AmqpAdapter } from '../adapters/amqp.adapter.ts';
import { DenoKvAdapter } from '../adapters/deno-kv.adapter.ts';
import type { DeadLetterRecord, DeadLetterStorePort } from '../ports/dead-letter.ts';
import type { MessageContext } from '../ports/message-queue.ts';

type ContextHarness<T> = {
  createContext(
    messageId: string,
    payload: T,
    enqueuedAt: Date,
    headers: Record<string, string>,
    deliveryCount: number,
  ): MessageContext;
};

class RecordingDeadLetterStore<T> implements DeadLetterStorePort<T> {
  readonly records: DeadLetterRecord<T>[] = [];

  append(record: DeadLetterRecord<T>): Promise<void> {
    this.records.push(record);
    return Promise.resolve();
  }

  list(): Promise<DeadLetterRecord<T>[]> {
    return Promise.resolve([...this.records]);
  }

  reprocess(): Promise<number> {
    return Promise.resolve(0);
  }

  depth(): Promise<number> {
    return Promise.resolve(this.records.length);
  }
}

Deno.test('DenoKvAdapter terminal nack writes to the dead-letter store', async () => {
  const deadLetterStore = new RecordingDeadLetterStore<{ id: string }>();
  const adapter = new DenoKvAdapter<{ id: string }>({
    queueName: 'jobs',
    deadLetterStore,
    useShared: false,
  }) as unknown as ContextHarness<{ id: string }>;
  const context = adapter.createContext(
    'msg-1',
    { id: 'msg-1' },
    new Date('2026-06-20T00:00:00.000Z'),
    { traceparent: '00-test' },
    2,
  );

  await context.nack({ requeue: false, errorMessage: 'invalid' });

  assertEquals(deadLetterStore.records.length, 1);
  assertEquals(deadLetterStore.records[0].reason, 'nack_without_requeue');
  assertEquals(deadLetterStore.records[0].payload, { id: 'msg-1' });
  assertEquals(deadLetterStore.records[0].deliveryCount, 2);
  assertEquals(deadLetterStore.records[0].errorMessage, 'invalid');
});

Deno.test('AmqpAdapter terminal nack writes to the dead-letter store', async () => {
  const deadLetterStore = new RecordingDeadLetterStore<{ id: string }>();
  const adapter = Object.create(AmqpAdapter.prototype) as ContextHarness<{ id: string }> & {
    queueName: string;
    explicitDeadLetterStore: DeadLetterStorePort<{ id: string }>;
    deadLetterStore: DeadLetterStorePort<{ id: string }> | null;
  };
  adapter.queueName = 'jobs';
  adapter.explicitDeadLetterStore = deadLetterStore;
  adapter.deadLetterStore = null;
  const context = adapter.createContext(
    'msg-2',
    { id: 'msg-2' },
    new Date('2026-06-20T00:00:01.000Z'),
    { traceparent: '00-test' },
    1,
  );

  await context.nack({ requeue: false, errorCode: 'handler.failed' });

  assertEquals(deadLetterStore.records.length, 1);
  assertEquals(deadLetterStore.records[0].reason, 'nack_without_requeue');
  assertEquals(deadLetterStore.records[0].payload, { id: 'msg-2' });
  assertEquals(deadLetterStore.records[0].errorCode, 'handler.failed');
});
