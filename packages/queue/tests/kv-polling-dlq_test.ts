import { assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvPollingAdapter } from '../adapters/kv-polling.adapter.ts';
import type { DeadLetterRecord, DeadLetterStorePort } from '../ports/dead-letter.ts';

interface QueueMessage<T> {
  readonly id: string;
  readonly payload: T;
  readonly queue: string;
  readonly enqueuedAt: string;
  readonly availableAt: string;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly priority: number;
  readonly headers: Record<string, string>;
}

interface KvPollingHarness<T> {
  nack(message: QueueMessage<T>, options: { requeue?: boolean }): Promise<void>;
  getStats(): Promise<{ pending: number; processing: number; dlq: number }>;
  reprocessDlq(limit?: number): Promise<number>;
}

class RecordingDeadLetterStore<T> implements DeadLetterStorePort<T> {
  readonly records: DeadLetterRecord<T>[] = [];

  append(record: DeadLetterRecord<T>): Promise<void> {
    this.records.push(record);
    return Promise.resolve();
  }

  list(options: { limit?: number } = {}): Promise<DeadLetterRecord<T>[]> {
    return Promise.resolve(this.records.slice(0, options.limit));
  }

  async reprocess(
    reenqueue: (record: DeadLetterRecord<T>) => Promise<void>,
    options: { limit?: number } = {},
  ): Promise<number> {
    const selected = this.records.slice(0, options.limit);
    for (const record of selected) {
      await reenqueue(record);
    }
    this.records.splice(0, selected.length);
    return selected.length;
  }

  depth(): Promise<number> {
    return Promise.resolve(this.records.length);
  }
}

function createMessage(
  id: string,
  attempts: number,
  maxAttempts: number,
): QueueMessage<{ id: string }> {
  return {
    id,
    payload: { id },
    queue: 'jobs',
    enqueuedAt: '2026-06-20T00:00:00.000Z',
    availableAt: '2026-06-20T00:00:00.000Z',
    attempts,
    maxAttempts,
    priority: 80,
    headers: { traceparent: '00-test' },
  };
}

Deno.test('KvPollingAdapter routes terminal nacks through the dead-letter store', async () => {
  const kv = new MemoryKvAdapter();
  const deadLetterStore = new RecordingDeadLetterStore<{ id: string }>();
  const queue = new KvPollingAdapter<{ id: string }>({
    queueName: 'jobs',
    kv,
    deadLetterStore,
  }) as unknown as KvPollingHarness<{ id: string }>;

  await queue.nack(createMessage('msg-explicit', 1, 3), { requeue: false });
  await queue.nack(createMessage('msg-max', 3, 3), { requeue: true });

  assertEquals(deadLetterStore.records.map((record) => record.reason), [
    'nack_without_requeue',
    'max_attempts_exceeded',
  ]);
  assertEquals(deadLetterStore.records[0].payload, { id: 'msg-explicit' });
  assertEquals(deadLetterStore.records[1].deliveryCount, 3);
  assertEquals((await queue.getStats()).dlq, 2);

  const reprocessed = await queue.reprocessDlq(1);

  assertEquals(reprocessed, 1);
  assertEquals(deadLetterStore.records.map((record) => record.messageId), ['msg-max']);
  const pending = [];
  for await (
    const entry of kv.list<QueueMessage<{ id: string }>>({ prefix: ['queue:pending', 'jobs'] })
  ) {
    pending.push(entry.value);
  }
  assertEquals(pending.length, 1);
  assertEquals(pending[0].id, 'msg-explicit');
  assertEquals(pending[0].attempts, 0);
});
