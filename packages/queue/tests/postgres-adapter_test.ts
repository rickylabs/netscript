import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertRejects,
  assertStringIncludes,
} from '@std/assert';
import { createQueue, QueueConnectionError, QueueProvider } from '../mod.ts';
import { PostgresAdapter, type PostgresQueueClient } from '../adapters/postgres.adapter.ts';
import type { DeadLetterRecord, DeadLetterStorePort } from '../ports/dead-letter.ts';

interface StoredMessage {
  readonly queueName: string;
  readonly messageId: string;
  readonly payload: unknown;
  readonly headers: Record<string, string>;
  deliveryCount: number;
  readonly enqueuedAt: Date;
  availableAt: Date;
  lockedAt?: Date;
  lockedBy?: string;
}

class FakePostgresClient implements PostgresQueueClient {
  readonly statements: string[] = [];
  readonly rows = new Map<string, StoredMessage>();

  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<{ readonly rows: Row[] }> {
    this.statements.push(text);
    const normalized = text.replace(/\s+/g, ' ').trim();

    if (normalized.startsWith('CREATE TABLE') || normalized.startsWith('CREATE INDEX')) {
      return Promise.resolve({ rows: [] });
    }

    if (normalized.startsWith('INSERT INTO')) {
      const row: StoredMessage = {
        queueName: String(values[0]),
        messageId: String(values[1]),
        payload: JSON.parse(String(values[2])) as unknown,
        headers: JSON.parse(String(values[3])) as Record<string, string>,
        deliveryCount: Number(values[4]),
        enqueuedAt: new Date(String(values[5])),
        availableAt: values[6] instanceof Date ? values[6] : new Date(String(values[6])),
      };
      this.rows.set(row.messageId, row);
      return Promise.resolve({ rows: [] });
    }

    if (normalized.startsWith('UPDATE') && normalized.includes('RETURNING message_id')) {
      const queueName = String(values[0]);
      const consumerId = String(values[1]);
      const now = Date.now();
      const row = [...this.rows.values()]
        .filter((candidate) => {
          if (candidate.queueName !== queueName || candidate.availableAt.getTime() > now) {
            return false;
          }
          return !candidate.lockedAt;
        })
        .sort((left, right) => {
          const byAvailability = left.availableAt.getTime() - right.availableAt.getTime();
          return byAvailability || left.enqueuedAt.getTime() - right.enqueuedAt.getTime();
        })[0];

      if (!row) {
        return Promise.resolve({ rows: [] });
      }

      row.lockedBy = consumerId;
      row.lockedAt = new Date();
      row.deliveryCount++;
      return Promise.resolve({
        rows: [{
          message_id: row.messageId,
          payload: row.payload,
          headers: row.headers,
          delivery_count: row.deliveryCount,
          enqueued_at: row.enqueuedAt,
        } as unknown as Row],
      });
    }

    if (normalized.startsWith('DELETE FROM')) {
      this.rows.delete(String(values[1]));
      return Promise.resolve({ rows: [] });
    }

    if (normalized.startsWith('UPDATE') && normalized.includes('SET locked_at = NULL')) {
      const row = this.rows.get(String(values[1]));
      if (row) {
        row.lockedAt = undefined;
        row.lockedBy = undefined;
        row.availableAt = new Date();
      }
      return Promise.resolve({ rows: [] });
    }

    throw new Error(`Unexpected SQL: ${normalized}`);
  }
}

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

Deno.test('PostgresAdapter publishes, consumes, and acknowledges with table-backed claims', async () => {
  const client = new FakePostgresClient();
  const queue = new PostgresAdapter<{ body: string }>({
    client,
    queueName: 'emails',
    tableName: 'queue_messages',
    pollInterval: 1,
  });
  await queue.enqueue({ body: 'hello' }, { headers: { traceparent: 'abc' } });

  const controller = new AbortController();
  await queue.listen(
    (message, context) => {
      assertEquals(message, { body: 'hello' });
      assertEquals(context.headers, { traceparent: 'abc' });
      assertEquals(context.deliveryCount, 1);
      controller.abort();
      return Promise.resolve();
    },
    { signal: controller.signal },
  );

  assertEquals(client.rows.size, 0);
  assert(client.statements.some((statement) => statement.includes('FOR UPDATE SKIP LOCKED')));
});

Deno.test('PostgresAdapter nacks with requeue by releasing the claim', async () => {
  const client = new FakePostgresClient();
  const queue = new PostgresAdapter<string>({
    client,
    queueName: 'jobs',
    pollInterval: 1,
  });
  await queue.enqueue('retry');

  const firstController = new AbortController();
  await queue.listen(
    async (_message, context) => {
      await context.nack({ requeue: true });
      firstController.abort();
    },
    { signal: firstController.signal },
  );

  assertEquals(client.rows.size, 1);
  const row = [...client.rows.values()][0];
  assertEquals(row.lockedAt, undefined);
  assertEquals(row.deliveryCount, 1);
});

Deno.test('PostgresAdapter dead-letters explicit terminal nacks before deleting the row', async () => {
  const client = new FakePostgresClient();
  const deadLetterStore = new RecordingDeadLetterStore<string>();
  const queue = new PostgresAdapter<string>({
    client,
    deadLetterStore,
    queueName: 'jobs',
    pollInterval: 1,
  });
  await queue.enqueue('poison');

  const controller = new AbortController();
  await queue.listen(
    async (_message, context) => {
      await context.nack({ requeue: false, errorMessage: 'poison' });
      controller.abort();
    },
    { signal: controller.signal },
  );

  assertEquals(client.rows.size, 0);
  assertEquals(deadLetterStore.records.length, 1);
  assertEquals(deadLetterStore.records[0].reason, 'nack_without_requeue');
  assertEquals(deadLetterStore.records[0].payload, 'poison');
  assertEquals(deadLetterStore.records[0].errorMessage, 'poison');
});

Deno.test('PostgresAdapter dead-letters requeued failures after max attempts', async () => {
  const client = new FakePostgresClient();
  const deadLetterStore = new RecordingDeadLetterStore<string>();
  const queue = new PostgresAdapter<string>({
    client,
    deadLetterStore,
    queueName: 'jobs',
    pollInterval: 1,
    maxRetries: 0,
  });
  await queue.enqueue('poison');

  await assertRejects(
    () => queue.listen(() => Promise.reject(new Error('boom'))),
    Error,
    'Queue listener failed',
  );

  assertEquals(client.rows.size, 0);
  assertEquals(deadLetterStore.records.length, 1);
  assertEquals(deadLetterStore.records[0].reason, 'max_attempts_exceeded');
  assertEquals(deadLetterStore.records[0].deliveryCount, 1);
});

Deno.test('createQueue(Postgres) no longer returns the not-implemented stub', async () => {
  const envKeys = [
    'POSTGRESDB_DATABASE',
    'POSTGRESDB_HOST',
    'POSTGRESDB_PORT',
    'POSTGRESDB_USERNAME',
    'POSTGRESDB_PASSWORD',
    'POSTGRESDB_URI',
  ];
  const previous = new Map(envKeys.map((key) => [key, Deno.env.get(key)]));
  for (const key of envKeys) {
    Deno.env.delete(key);
  }

  try {
    const queue = createQueue('jobs', {
      provider: QueueProvider.Postgres,
      disableAutoTracing: true,
    });
    const error = await assertRejects(() => queue.enqueue({ id: 1 }));
    assertInstanceOf(error, QueueConnectionError);
    assertStringIncludes(error.message, 'PostgreSQL connection not found');
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        Deno.env.delete(key);
      } else {
        Deno.env.set(key, value);
      }
    }
  }
});
