import { assertEquals } from '@std/assert';
import { RedisAdapter } from '../adapters/redis.adapter.ts';
import { createEnvelope } from '../adapters/_envelope.ts';
import type { DeadLetterRecord, DeadLetterStorePort } from '../ports/dead-letter.ts';
import type { MessageContext } from '../ports/message-queue.ts';

type RedisHarness<T> = {
  clients: {
    commands: FakeRedisCommands;
    blocking: Record<string, unknown>;
  };
  handleEncodedMessage(
    encoded: string,
    handler: (message: T, context: MessageContext) => Promise<void>,
  ): Promise<void>;
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

class FakeRedisCommands {
  readonly removed: string[] = [];
  readonly requeued: string[] = [];

  lrem(_key: string, _count: number, encoded: string): Promise<number> {
    this.removed.push(encoded);
    return Promise.resolve(1);
  }

  lpush(_key: string, encoded: string): Promise<number> {
    this.requeued.push(encoded);
    return Promise.resolve(1);
  }
}

Deno.test('RedisAdapter dead-letters explicit terminal nacks instead of dropping', async () => {
  const deadLetterStore = new RecordingDeadLetterStore<{ id: string }>();
  const queue = new RedisAdapter<{ id: string }>(
    'redis://example',
    'jobs',
    undefined,
    deadLetterStore,
  ) as unknown as RedisHarness<{ id: string }>;
  const commands = new FakeRedisCommands();
  queue.clients = {
    commands,
    blocking: {},
  };
  const encoded = JSON.stringify(createEnvelope({ id: 'msg-1' }, {
    headers: { traceparent: '00-test' },
  }));

  await queue.handleEncodedMessage(
    encoded,
    async (_message: { id: string }, context: MessageContext) => {
      await context.nack({ requeue: false, errorMessage: 'poison' });
    },
  );

  assertEquals(commands.removed, [encoded]);
  assertEquals(commands.requeued, []);
  assertEquals(deadLetterStore.records.length, 1);
  assertEquals(deadLetterStore.records[0].reason, 'nack_without_requeue');
  assertEquals(deadLetterStore.records[0].payload, { id: 'msg-1' });
  assertEquals(deadLetterStore.records[0].errorMessage, 'poison');
});
