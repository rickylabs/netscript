import { assertEquals, assertStringIncludes } from '@std/assert';
import { PostgresDeadLetterStore } from '../adapters/postgres-dead-letter-store.ts';
import { RedisDeadLetterStore } from '../adapters/redis-dead-letter-store.ts';
import type { RedisDeadLetterCommands } from '../adapters/redis-dead-letter-store.ts';
import type { PostgresQueueClient } from '../adapters/postgres.adapter.ts';
import type { DeadLetterRecord } from '../ports/dead-letter.ts';

function createRecord(
  messageId: string,
  failedAt: string,
): DeadLetterRecord<{ id: string }> {
  return {
    messageId,
    queueName: 'jobs',
    payload: { id: messageId },
    headers: { traceparent: '00-test' },
    deliveryCount: 4,
    enqueuedAt: '2026-06-20T00:00:00.000Z',
    failedAt,
    reason: 'nack_without_requeue',
    errorCode: 'VALIDATION_ERROR',
    errorMessage: 'invalid message',
  };
}

interface StoredDlqRow {
  readonly queue_name: string;
  readonly message_id: string;
  readonly payload: unknown;
  readonly headers: Record<string, string>;
  readonly delivery_count: number;
  readonly enqueued_at: string;
  readonly failed_at: string;
  readonly reason: string;
  readonly error_code: string | null;
  readonly error_message: string | null;
}

class FakePostgresClient implements PostgresQueueClient {
  readonly statements: string[] = [];
  readonly rows = new Map<string, StoredDlqRow>();

  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<{ readonly rows: Row[] }> {
    this.statements.push(text);
    const normalized = text.replace(/\s+/g, ' ').trim();

    if (normalized.startsWith('CREATE TABLE')) {
      return Promise.resolve({ rows: [] });
    }

    if (normalized.startsWith('INSERT INTO')) {
      const row: StoredDlqRow = {
        queue_name: String(values[0]),
        message_id: String(values[1]),
        payload: JSON.parse(String(values[2])) as unknown,
        headers: JSON.parse(String(values[3])) as Record<string, string>,
        delivery_count: Number(values[4]),
        enqueued_at: String(values[5]),
        failed_at: String(values[6]),
        reason: String(values[7]),
        error_code: values[8] === null ? null : String(values[8]),
        error_message: values[9] === null ? null : String(values[9]),
      };
      const key = `${row.queue_name}:${row.message_id}`;
      if (!this.rows.has(key)) {
        this.rows.set(key, row);
      }
      return Promise.resolve({ rows: [] });
    }

    if (normalized.startsWith('SELECT queue_name')) {
      const queueName = String(values[0]);
      const limit = Number(values[1]);
      const rows = [...this.rows.values()]
        .filter((row) => row.queue_name === queueName)
        .sort((left, right) =>
          left.failed_at.localeCompare(right.failed_at) ||
          left.message_id.localeCompare(right.message_id)
        )
        .slice(0, limit);
      return Promise.resolve({ rows: rows as unknown as Row[] });
    }

    if (normalized.startsWith('SELECT COUNT')) {
      const queueName = String(values[0]);
      const count = [...this.rows.values()].filter((row) => row.queue_name === queueName).length;
      return Promise.resolve({ rows: [{ count } as unknown as Row] });
    }

    if (normalized.startsWith('DELETE FROM')) {
      this.rows.delete(`${String(values[0])}:${String(values[1])}`);
      return Promise.resolve({ rows: [] });
    }

    throw new Error(`Unexpected SQL: ${normalized}`);
  }
}

class FakeRedisCommands implements RedisDeadLetterCommands {
  readonly values: string[] = [];
  readonly calls: string[] = [];

  rpush(key: string, value: string): number {
    this.calls.push(`rpush:${key}`);
    this.values.push(value);
    return this.values.length;
  }

  lrange(key: string, start: number, stop: number): string[] {
    this.calls.push(`lrange:${key}:${start}:${stop}`);
    const end = stop < 0 ? undefined : stop + 1;
    return this.values.slice(start, end);
  }

  llen(key: string): number {
    this.calls.push(`llen:${key}`);
    return this.values.length;
  }

  lpop(key: string): string | null {
    this.calls.push(`lpop:${key}`);
    return this.values.shift() ?? null;
  }
}

Deno.test('PostgresDeadLetterStore appends idempotently, lists, counts, and reprocesses', async () => {
  const client = new FakePostgresClient();
  const store = new PostgresDeadLetterStore<{ id: string }>({
    client,
    queueName: 'jobs',
    tableName: 'message_queue',
  });
  const first = createRecord('msg-1', '2026-06-20T00:00:01.000Z');
  const second = createRecord('msg-2', '2026-06-20T00:00:02.000Z');

  await store.append(first);
  await store.append(first);
  await store.append(second);

  assertEquals(await store.depth(), 2);
  assertEquals(await store.list({ limit: 1 }), [first]);
  assertEquals(await store.list(), [first, second]);
  assertStringIncludes(
    client.statements.join('\n'),
    'ON CONFLICT (queue_name, message_id) DO NOTHING',
  );
  assertStringIncludes(client.statements.join('\n'), '"message_queue_dlq"');

  const reprocessed: DeadLetterRecord<{ id: string }>[] = [];
  const count = await store.reprocess((record) => {
    reprocessed.push(record);
    return Promise.resolve();
  });

  assertEquals(count, 2);
  assertEquals(reprocessed, [first, second]);
  assertEquals(await store.depth(), 0);
});

Deno.test('RedisDeadLetterStore uses list commands for append, list, count, and reprocess', async () => {
  const commands = new FakeRedisCommands();
  const store = new RedisDeadLetterStore<{ id: string }>({
    commands,
    queueName: 'jobs',
  });
  const first = createRecord('msg-1', '2026-06-20T00:00:01.000Z');
  const second = createRecord('msg-2', '2026-06-20T00:00:02.000Z');

  await store.append(first);
  await store.append(second);

  assertEquals(await store.depth(), 2);
  assertEquals(await store.list({ limit: 1 }), [first]);
  assertEquals(await store.list(), [first, second]);

  const reprocessed: DeadLetterRecord<{ id: string }>[] = [];
  const count = await store.reprocess((record) => {
    reprocessed.push(record);
    return Promise.resolve();
  }, { limit: 1 });

  assertEquals(count, 1);
  assertEquals(reprocessed, [first]);
  assertEquals(await store.depth(), 1);
  assertEquals(commands.calls.includes('rpush:netscript:dlq:jobs'), true);
  assertEquals(commands.calls.includes('lpop:netscript:dlq:jobs'), true);
});
