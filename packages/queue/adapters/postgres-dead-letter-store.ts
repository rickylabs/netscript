/**
 * PostgreSQL-backed dead-letter store for queue terminal failures.
 *
 * @module
 */

import { QueueError, QueueErrorCode } from '../ports/errors.ts';
import type { DeadLetterRecord, DeadLetterStorePort } from '../ports/dead-letter.ts';
import type { PostgresQueueClient } from './postgres.adapter.ts';

const DEFAULT_QUEUE_TABLE = 'message_queue';

interface DeadLetterRow extends Record<string, unknown> {
  readonly message_id: string;
  readonly queue_name: string;
  readonly payload: unknown;
  readonly headers: unknown;
  readonly delivery_count: number;
  readonly enqueued_at: Date | string;
  readonly failed_at: Date | string;
  readonly reason: string;
  readonly error_code?: string | null;
  readonly error_message?: string | null;
}

/**
 * Options for {@link PostgresDeadLetterStore}.
 */
export interface PostgresDeadLetterStoreOptions {
  /** PostgreSQL client shared with the queue adapter. */
  client: PostgresQueueClient;
  /** Queue namespace whose dead-letter records are stored. */
  queueName: string;
  /** Base queue table name. The DLQ table is `<tableName>_dlq`. */
  tableName?: string;
}

/**
 * Durable dead-letter store backed by a PostgreSQL table.
 *
 * @template T - Original message payload type.
 */
export class PostgresDeadLetterStore<T = unknown> implements DeadLetterStorePort<T> {
  private readonly client: PostgresQueueClient;
  private readonly queueName: string;
  private readonly tableName: string;
  private readonly tableIdentifier: string;
  private schemaReady: Promise<void> | null = null;

  /**
   * Create a PostgreSQL-backed dead-letter store.
   *
   * @param options - Store configuration and caller-owned PostgreSQL client.
   */
  constructor(options: PostgresDeadLetterStoreOptions) {
    this.client = options.client;
    this.queueName = options.queueName;
    this.tableName = `${options.tableName ?? DEFAULT_QUEUE_TABLE}_dlq`;
    this.tableIdentifier = quoteQualifiedIdentifier(this.tableName);
  }

  /**
   * Persist a dead-letter record idempotently.
   *
   * @param record - Record to append.
   */
  async append(record: DeadLetterRecord<T>): Promise<void> {
    await this.ensureSchema();
    await this.client.query(
      `INSERT INTO ${this.tableIdentifier} (
        queue_name,
        message_id,
        payload,
        headers,
        delivery_count,
        enqueued_at,
        failed_at,
        reason,
        error_code,
        error_message
      ) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (queue_name, message_id) DO NOTHING`,
      [
        record.queueName,
        record.messageId,
        JSON.stringify(record.payload),
        JSON.stringify(record.headers),
        record.deliveryCount,
        record.enqueuedAt,
        record.failedAt,
        record.reason,
        record.errorCode ?? null,
        record.errorMessage ?? null,
      ],
    );
  }

  /**
   * List records in failure-time order.
   *
   * @param options - Optional maximum number of records.
   * @returns Stored records.
   */
  async list(options: { limit?: number } = {}): Promise<DeadLetterRecord<T>[]> {
    await this.ensureSchema();
    const result = await this.client.query<DeadLetterRow>(
      `SELECT queue_name, message_id, payload, headers, delivery_count, enqueued_at, failed_at,
        reason, error_code, error_message
      FROM ${this.tableIdentifier}
      WHERE queue_name = $1
      ORDER BY failed_at ASC, message_id ASC
      LIMIT $2`,
      [this.queueName, options.limit ?? 100],
    );
    return result.rows.map((row) => rowToRecord<T>(row));
  }

  /**
   * Re-enqueue records and delete rows after successful requeue.
   *
   * @param reenqueue - Adapter-owned requeue callback.
   * @param options - Optional maximum number of rows.
   * @returns Number of records reprocessed.
   */
  async reprocess(
    reenqueue: (record: DeadLetterRecord<T>) => Promise<void>,
    options: { limit?: number } = {},
  ): Promise<number> {
    const records = await this.list(options);
    for (const record of records) {
      await reenqueue(record);
      await this.client.query(
        `DELETE FROM ${this.tableIdentifier}
        WHERE queue_name = $1 AND message_id = $2`,
        [this.queueName, record.messageId],
      );
    }
    return records.length;
  }

  /**
   * Count stored records.
   *
   * @returns Number of records for this queue namespace.
   */
  async depth(): Promise<number> {
    await this.ensureSchema();
    const result = await this.client.query<{ readonly count: string | number }>(
      `SELECT COUNT(*) AS count
      FROM ${this.tableIdentifier}
      WHERE queue_name = $1`,
      [this.queueName],
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  private async ensureSchema(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = this.createSchema();
    }
    await this.schemaReady;
  }

  private async createSchema(): Promise<void> {
    await this.client.query(
      `CREATE TABLE IF NOT EXISTS ${this.tableIdentifier} (
        queue_name TEXT NOT NULL,
        message_id TEXT NOT NULL,
        payload JSONB NOT NULL,
        headers JSONB NOT NULL DEFAULT '{}'::jsonb,
        delivery_count INTEGER NOT NULL DEFAULT 0,
        enqueued_at TIMESTAMPTZ NOT NULL,
        failed_at TIMESTAMPTZ NOT NULL,
        reason TEXT NOT NULL,
        error_code TEXT,
        error_message TEXT,
        PRIMARY KEY (queue_name, message_id)
      )`,
    );
  }
}

function rowToRecord<T>(row: DeadLetterRow): DeadLetterRecord<T> {
  return {
    queueName: row.queue_name,
    messageId: row.message_id,
    payload: row.payload as T,
    headers: normalizeHeaders(row.headers),
    deliveryCount: row.delivery_count,
    enqueuedAt: formatIso(row.enqueued_at),
    failedAt: formatIso(row.failed_at),
    reason: row.reason as DeadLetterRecord<T>['reason'],
    errorCode: row.error_code === null ? undefined : row.error_code,
    errorMessage: row.error_message === null ? undefined : row.error_message,
  };
}

function quoteQualifiedIdentifier(name: string): string {
  const parts = name.split('.');
  if (parts.some((part) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(part))) {
    throw new QueueError(
      `Invalid PostgreSQL DLQ table name: ${name}`,
      QueueErrorCode.CONFIGURATION_ERROR,
      { context: { tableName: name } },
    );
  }
  return parts.map((part) => `"${part.replaceAll('"', '""')}"`).join('.');
}

function normalizeHeaders(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, String(value)]),
  );
}

function formatIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
